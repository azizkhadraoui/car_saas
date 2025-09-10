import { NextResponse } from 'next/server';

const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const model = searchParams.get('model');

    console.log('Years API called with:', { brand, model });

    // If no brand is specified or it's 'all', return empty array
    // Years should only be available after both brand and model are selected
    if (!brand || brand === 'all') {
      console.log('No brand specified, returning empty years array');
      return NextResponse.json([]);
    }

    // If no model is specified or it's 'all', return empty array
    // Years depend on both brand and model being selected
    if (!model || model === 'all') {
      console.log('No model specified, returning empty years array');
      return NextResponse.json([]);
    }

    // Since NHTSA doesn't have a direct "get years for make/model" endpoint,
    // we'll check a range of recent years to see which ones have data
    const currentYear = new Date().getFullYear();
    const startYear = 1980; // Start from 1980 to cover most vehicles
    const availableYears: number[] = [];

    // We'll check years in batches to avoid too many API calls
    // Check recent years more thoroughly, older years with bigger gaps
    const yearsToCheck: number[] = [];
    
    // Add recent years (last 30 years) - check every year
    for (let year = currentYear; year >= currentYear - 30; year--) {
      yearsToCheck.push(year);
    }
    
    // Add older years (every 5 years for efficiency)
    for (let year = currentYear - 35; year >= startYear; year -= 5) {
      yearsToCheck.push(year);
    }

    console.log(`Checking ${yearsToCheck.length} years for ${brand} ${model}`);

    // Check each year by trying to get models for that make/year combination
    // If the specific model exists in that year, we'll find it
    const batchSize = 5; // Reduced batch size for car-specific queries
    for (let i = 0; i < yearsToCheck.length; i += batchSize) {
      const batch = yearsToCheck.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (year) => {
        try {
          // Add vehicletype=car to limit to cars only
          const url = `${NHTSA_BASE_URL}/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(brand)}/modelyear/${year}/vehicletype/car?format=json`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'CarDealerApp/1.0'
            }
          });
          
          if (!response.ok) {
            return null;
          }
          
          const data = await response.json();
          
          // Check if the specific model exists in this year
          if (data.Results && Array.isArray(data.Results)) {
            const hasModel = data.Results.some((result: any) => 
              result.Model_Name && 
              result.Model_Name.toLowerCase().includes(model.toLowerCase())
            );
            
            return hasModel ? year : null;
          }
          
          return null;
        } catch (error) {
          console.error(`Error checking year ${year}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validYears = batchResults.filter(year => year !== null) as number[];
      availableYears.push(...validYears);

      // Add a small delay between batches to be respectful to the API
      if (i + batchSize < yearsToCheck.length) {
        await new Promise(resolve => setTimeout(resolve, 150)); // Slightly longer delay
      }
    }

    // Remove duplicates and sort
    const uniqueYears = Array.from(new Set(availableYears)).sort((a, b) => b - a);
    
    console.log(`Found ${uniqueYears.length} available years for ${brand} ${model}:`, uniqueYears);

    // If no years found from API, return a reasonable range as fallback
    if (uniqueYears.length === 0) {
      console.log('No years found from API, using fallback range');
      const fallbackYears = [];
      for (let year = currentYear; year >= currentYear - 25; year--) {
        fallbackYears.push(year);
      }
      return NextResponse.json(fallbackYears);
    }

    return NextResponse.json(uniqueYears);
  } catch (error) {
    console.error('Error in years API:', error);
    
    // Fallback to reasonable year range if API fails
    const currentYear = new Date().getFullYear();
    const fallbackYears = [];
    for (let year = currentYear; year >= currentYear - 25; year--) {
      fallbackYears.push(year);
    }
    
    return NextResponse.json(fallbackYears);
  }
}