// src/utils/tariffUtils.js

// Helper function to generate HS codes based on product category
const generateHSCode = (category) => {
    const hsCodeMap = {
        'Steel & Metals': '7208.10',
        'Electronics': '8517.12',
        'Other Products': '9999.00',
        'Automotive': '8703.23',
        'Agricultural Products': '1001.99',
        'Energy & Petroleum': '2709.00',
        'Textiles & Apparel': '6109.10',
        'Luxury Goods': '7113.11',
        'Carbon-Intensive Goods': '2701.11',
        'General Trade': '0000.00',
        'General': '0000.00'
    };
    
    return hsCodeMap[category] || '0000.00';
};

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
    
    // Handle rate fields with safe defaults - convert strings like "30%" to numbers
    const parseRate = (rateValue) => {
        if (typeof rateValue === 'number') return rateValue;
        if (typeof rateValue === 'string') {
            // Remove % symbol and convert to number
            const numericValue = parseFloat(rateValue.replace('%', '').trim());
            return isNaN(numericValue) ? 0 : numericValue;
        }
        return 0;
    };
    
    validatedTariff.currentRate = parseRate(tariff.currentRate ?? tariff.rate ?? 0);
    validatedTariff.rate = validatedTariff.currentRate; // Ensure consistency
    validatedTariff.previousRate = parseRate(tariff.previousRate ?? 0);
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
    validatedTariff.imposingCountry = tariff.imposingCountry || tariff.imposing_country || tariff.importer || null;
    validatedTariff.imposing_country = tariff.imposing_country || tariff.imposingCountry || tariff.importer || null;
    validatedTariff.products = tariff.products || tariff.relatedProducts || [];
    validatedTariff.relatedProducts = tariff.relatedProducts || tariff.products || [];
    validatedTariff.productCategory = tariff.productCategory || tariff.product_category || 'General';
    validatedTariff.product_category = tariff.product_category || tariff.productCategory || 'General';
    
    // Additional API field mappings
    validatedTariff.importer = tariff.importer || null;
    validatedTariff.exporter = tariff.exporter || null;
    
    // Handle classification codes - generate if missing
    validatedTariff.hsCode = tariff.hsCode || tariff.hs_code || generateHSCode(validatedTariff.productCategory);
    validatedTariff.hs_code = tariff.hs_code || tariff.hsCode || validatedTariff.hsCode;
    
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
    
    // Ensure numeric fields are actually numbers (already handled by parseRate function above)
    // Additional validation for other numeric fields
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
