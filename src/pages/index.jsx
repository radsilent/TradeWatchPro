import Layout from "./Layout.jsx";
import Dashboard from "./Dashboard.jsx";
import Disruptions from "./Disruptions.jsx";
import Analytics from "./Analytics.jsx";
import LiveAIS from "./LiveAIS.jsx";

import VesselTracking from "./VesselTracking.jsx";
import TariffTracking from "./TariffTracking.jsx";
import TradeRoutes from "./TradeRoutes.jsx";
import LivePortView from "./LivePortView.jsx";
import MobileAppDownload from "./MobileAppDownload.jsx";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Disruptions: Disruptions,
    
    Analytics: Analytics,
    
    LiveAIS: LiveAIS,
    

    
    VesselTracking: VesselTracking,
    
    TariffTracking: TariffTracking,
    
    TradeRoutes: TradeRoutes,
    
    LivePortView: LivePortView,
    
    MobileAppDownload: MobileAppDownload,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    console.log("Current location:", location.pathname);
    console.log("Current page:", currentPage);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Disruptions" element={<Disruptions />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/LiveAIS" element={<LiveAIS />} />
                

                
                <Route path="/VesselTracking" element={<VesselTracking />} />
                
                <Route path="/TariffTracking" element={<TariffTracking />} />
                
                <Route path="/TradeRoutes" element={<TradeRoutes />} />
                
                <Route path="/LivePortView" element={<LivePortView />} />
                
                <Route path="/mobile-app-download" element={<MobileAppDownload />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}