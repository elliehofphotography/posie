/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import ChecklistOverview from './pages/ChecklistOverview';
import Discover from './pages/Discover';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import ShootMode from './pages/ShootMode';
import ShotList from './pages/ShotList';
import Template from './pages/Template';
import Settings from './pages/Settings';
import GuideDetail from './pages/GuideDetail';


export const PAGES = {
    "ChecklistOverview": ChecklistOverview,
    "Discover": Discover,
    "Home": Home,
    "Marketplace": Marketplace,
    "ShootMode": ShootMode,
    "ShotList": ShotList,
    "Template": Template,
    "Settings": Settings,
    "GuideDetail": GuideDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};