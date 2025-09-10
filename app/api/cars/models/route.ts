import { NextResponse } from 'next/server';

const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');

    if (!brand || brand === 'all') {
      return NextResponse.json([]);
    }

    console.log(`Fetching car models for brand: ${brand}`);

    // Use GetModelsForMakeYear with vehicletype=car to limit to cars only
    // We'll get models for recent years to ensure we capture current models
    const currentYear = new Date().getFullYear();
    const yearsToCheck = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];
    
    const allModels = new Set<string>();

    // Get models for multiple recent years and combine them
    const modelPromises = yearsToCheck.map(async (year) => {
      try {
        const url = `${NHTSA_BASE_URL}/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(brand)}/modelyear/${year}/vehicletype/car?format=json`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'CarDealerApp/1.0'
          }
        });

        if (!response.ok) {
          console.warn(`Failed to fetch models for ${brand} ${year}: ${response.status}`);
          return [];
        }

        const data = await response.json();
        
        if (!data.Results || !Array.isArray(data.Results)) {
          return [];
        }

        return data.Results
          .map((model: any) => model.Model_Name)
          .filter((name: string) => name && name.trim() !== '');
          
      } catch (error) {
        console.error(`Error fetching models for ${brand} ${year}:`, error);
        return [];
      }
    });

    // Wait for all promises and combine results
    const modelArrays = await Promise.all(modelPromises);
    
    // Combine all models from different years
    modelArrays.forEach(models => {
      models.forEach(model => allModels.add(model));
    });

    // Convert to array and sort
    const uniqueModels = Array.from(allModels)
      .sort((a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

    console.log(`Found ${uniqueModels.length} car models for ${brand}`);

    // If no models found, try the simpler endpoint (without year restriction)
    if (uniqueModels.length === 0) {
      console.log(`No models found with year restriction, trying general endpoint for ${brand}`);
      
      try {
        const fallbackUrl = `${NHTSA_BASE_URL}/vehicles/GetModelsForMake/${encodeURIComponent(brand)}?format=json`;
        const fallbackResponse = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'CarDealerApp/1.0'
          }
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData.Results && Array.isArray(fallbackData.Results)) {
            const fallbackModels = fallbackData.Results
              .map((model: any) => model.Model_Name)
              .filter((name: string) => name && name.trim() !== '')
              .sort((a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

            const uniqueFallbackModels = Array.from(new Set(fallbackModels));
            console.log(`Found ${uniqueFallbackModels.length} models using fallback endpoint`);
            
            return NextResponse.json(uniqueFallbackModels);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback model fetch also failed:', fallbackError);
      }
    }

    return NextResponse.json(uniqueModels);
  } catch (error) {
    console.error('Error fetching car models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch car models' }, 
      { status: 500 }
    );
  }
}