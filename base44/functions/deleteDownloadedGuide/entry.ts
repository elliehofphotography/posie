import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { downloadId, listingId } = await req.json();

    if (!downloadId || !listingId) {
      return Response.json({ error: 'Missing downloadId or listingId' }, { status: 400 });
    }

    // Delete the Download record
    await base44.entities.Download.delete(downloadId);

    // Get all GuidePhotos for this listing
    const guidePhotos = await base44.entities.GuidePhoto.filter({ listing_id: listingId });

    // Get all TemplatePhotos that match any of these guide photos
    const allTemplatePhotos = await base44.entities.TemplatePhoto.list();
    const photosToDelete = allTemplatePhotos.filter(tp =>
      guidePhotos.some(gp => gp.image_url === tp.image_url)
    );

    // Delete all matching TemplatePhotos
    for (const photo of photosToDelete) {
      await base44.entities.TemplatePhoto.delete(photo.id);
    }

    // Update photo counts for all affected templates
    const affectedTemplateIds = [...new Set(photosToDelete.map(p => p.template_id))];
    for (const templateId of affectedTemplateIds) {
      const remainingPhotos = await base44.entities.TemplatePhoto.filter({ template_id: templateId });
      await base44.entities.ShootTemplate.update(templateId, {
        photo_count: remainingPhotos.length,
        cover_image: remainingPhotos.length > 0 ? remainingPhotos[0].image_url : ''
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting guide:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});