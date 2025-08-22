// src/utils/tariffUtils.js
export const validateTariffData = (tariff) => {
    const validatedTariff = { ...tariff };

    // Ensure essential fields are not null or undefined
    validatedTariff.id = tariff.id || `tariff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    validatedTariff.title = tariff.title || tariff.name || 'Unknown Tariff';
    validatedTariff.name = tariff.name || tariff.title || 'Unknown Tariff';
    validatedTariff.status = tariff.status || 'Active';
    validatedTariff.priority = tariff.priority || 'Medium';
    validatedTariff.category = tariff.category || tariff.productCategory || 'General Trade';
    validatedTariff.type = tariff.type || 'Tariff';
    
    // Handle rate fields with safe defaults
    validatedTariff.currentRate = tariff.currentRate ?? tariff.rate ?? 0;
    validatedTariff.rate = tariff.rate ?? tariff.currentRate ?? 0;
    validatedTariff.previousRate = tariff.previousRate ?? 0;
    validatedTariff.change = tariff.change ?? (validatedTariff.currentRate - validatedTariff.previousRate);
    validatedTariff.changePercent = tariff.changePercent ?? 
        (validatedTariff.previousRate !== 0 ? 
            ((validatedTariff.currentRate - validatedTariff.previousRate) / validatedTariff.previousRate) * 100 : 
            0);
    
    // Handle date fields
    validatedTariff.effectiveDate = tariff.effectiveDate || tariff.effective_date || new Date();
    validatedTariff.effective_date = tariff.effective_date || tariff.effectiveDate || new Date();
    validatedTariff.lastUpdate = tariff.lastUpdate || tariff.last_update || new Date();
    validatedTariff.last_update = tariff.last_update || tariff.lastUpdate || new Date();
    validatedTariff.created_date = tariff.created_date || tariff.createdDate || new Date();
    
    // Handle geographic and product fields
    validatedTariff.countries = tariff.countries || [];
    validatedTariff.imposingCountry = tariff.imposingCountry || tariff.imposing_country || null;
    validatedTariff.imposing_country = tariff.imposing_country || tariff.imposingCountry || null;
    validatedTariff.products = tariff.products || tariff.relatedProducts || [];
    validatedTariff.relatedProducts = tariff.relatedProducts || tariff.products || [];
    validatedTariff.productCategory = tariff.productCategory || tariff.product_category || 'General';
    validatedTariff.product_category = tariff.product_category || tariff.productCategory || 'General';
    
    // Handle classification codes
    validatedTariff.hsCode = tariff.hsCode || tariff.hs_code || 'N/A';
    validatedTariff.hs_code = tariff.hs_code || tariff.hsCode || 'N/A';
    
    // Handle impact and trade fields
    validatedTariff.estimatedImpact = tariff.estimatedImpact || tariff.estimated_impact || 'N/A';
    validatedTariff.estimated_impact = tariff.estimated_impact || tariff.estimatedImpact || 'N/A';
    validatedTariff.affectedTrade = tariff.affectedTrade ?? tariff.affected_trade ?? 0;
    validatedTariff.affected_trade = tariff.affected_trade ?? tariff.affectedTrade ?? 0;
    validatedTariff.tradeValue = tariff.tradeValue ?? tariff.trade_value ?? 0;
    validatedTariff.trade_value = tariff.trade_value ?? tariff.tradeValue ?? 0;
    
    // Handle description and trend
    validatedTariff.description = tariff.description || `Tariff measure on ${validatedTariff.productCategory}`;
    validatedTariff.trend = tariff.trend || (validatedTariff.change > 0 ? 'up' : validatedTariff.change < 0 ? 'down' : 'stable');
    
    // Handle news sources and legal details
    validatedTariff.sources = tariff.sources || [];
    validatedTariff.legalDetails = tariff.legalDetails || null;
    validatedTariff.rateBreakdown = tariff.rateBreakdown || null;
    
    // Ensure numeric fields are actually numbers
    if (typeof validatedTariff.currentRate === 'string') {
        validatedTariff.currentRate = parseFloat(validatedTariff.currentRate) || 0;
    }
    if (typeof validatedTariff.previousRate === 'string') {
        validatedTariff.previousRate = parseFloat(validatedTariff.previousRate) || 0;
    }
    if (typeof validatedTariff.change === 'string') {
        validatedTariff.change = parseFloat(validatedTariff.change) || 0;
    }
    if (typeof validatedTariff.affectedTrade === 'string') {
        validatedTariff.affectedTrade = parseFloat(validatedTariff.affectedTrade) || 0;
    }
    
    // Ensure dates are Date objects
    if (!(validatedTariff.effectiveDate instanceof Date)) {
        validatedTariff.effectiveDate = new Date(validatedTariff.effectiveDate);
    }
    if (!(validatedTariff.lastUpdate instanceof Date)) {
        validatedTariff.lastUpdate = new Date(validatedTariff.lastUpdate);
    }
    
    // Ensure arrays are actually arrays
    if (!Array.isArray(validatedTariff.countries)) {
        validatedTariff.countries = validatedTariff.countries ? [validatedTariff.countries] : [];
    }
    if (!Array.isArray(validatedTariff.products)) {
        validatedTariff.products = validatedTariff.products ? [validatedTariff.products] : [];
    }
    if (!Array.isArray(validatedTariff.sources)) {
        validatedTariff.sources = [];
    }

    return validatedTariff;
};
