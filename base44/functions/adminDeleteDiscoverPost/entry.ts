import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { postId } = await req.json();
    if (!postId) {
      return Response.json({ error: 'Missing postId' }, { status: 400 });
    }

    // Fetch the post to get its image_url
    const posts = await base44.asServiceRole.entities.DiscoverPost.filter({ id: postId });
    const post = posts[0];
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const imageUrl = post.image_url;

    // Find all TemplatePhotos with this image URL
    const affectedPhotos = await base44.asServiceRole.entities.TemplatePhoto.filter({ image_url: imageUrl });
    console.log(`Found ${affectedPhotos.length} TemplatePhoto(s) with this image URL`);

    // Collect unique user emails from affected photos (via created_by)
    const affectedUserEmails = [...new Set(affectedPhotos.map(p => p.created_by).filter(Boolean))];
    console.log(`Affected users: ${affectedUserEmails.join(', ')}`);

    // Also notify users who favorited this post
    const favorites = await base44.asServiceRole.entities.DiscoverFavorite.filter({ post_id: postId });
    const favUserEmails = favorites.map(f => f.user_email).filter(Boolean);

    const allAffectedEmails = [...new Set([...affectedUserEmails, ...favUserEmails])];

    // Delete all TemplatePhotos with this image URL
    for (const photo of affectedPhotos) {
      await base44.asServiceRole.entities.TemplatePhoto.delete(photo.id);
    }
    console.log(`Deleted ${affectedPhotos.length} TemplatePhoto(s)`);

    // Delete all favorites for this post
    for (const fav of favorites) {
      await base44.asServiceRole.entities.DiscoverFavorite.delete(fav.id);
    }
    console.log(`Deleted ${favorites.length} favorite(s)`);

    // Delete the DiscoverPost itself
    await base44.asServiceRole.entities.DiscoverPost.delete(postId);
    console.log(`Deleted DiscoverPost ${postId}`);

    // Send in-app notifications to all affected users
    const message = "One of your saved photos was removed because it didn't meet our community guidelines. We're sorry for the inconvenience.";
    for (const email of allAffectedEmails) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: email,
        message,
        is_read: false,
      });
    }
    console.log(`Sent notifications to ${allAffectedEmails.length} user(s)`);

    return Response.json({ success: true, affectedUsers: allAffectedEmails.length });
  } catch (error) {
    console.error('adminDeleteDiscoverPost error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});