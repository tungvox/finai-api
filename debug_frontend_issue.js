// Debug script to identify frontend loading issues
console.log('🔍 Debugging Frontend Loading Issue...');

async function debugAPI() {
  const BASE_URL = 'http://localhost:8000';
  
  console.log('\n1️⃣ Testing API server health...');
  try {
    const healthResponse = await fetch(`${BASE_URL}/`);
    console.log(`Health check status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API server is running:', healthData.message);
    } else {
      console.log('❌ API server health check failed');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to API server:', error.message);
    return;
  }

  console.log('\n2️⃣ Testing data endpoint with EURUSD...');
  try {
    const dataResponse = await fetch(`${BASE_URL}/get-data?symbol=EURUSD&interval=1h`);
    console.log(`Data endpoint status: ${dataResponse.status}`);
    
    if (dataResponse.ok) {
      const data = await dataResponse.json();
      console.log('✅ Data endpoint working');
      console.log(`   Symbol: ${data.symbol}`);
      console.log(`   Interval: ${data.interval}`);
      console.log(`   Candles: ${data.candles.length}`);
      console.log(`   Date range: ${data.date_range.start} to ${data.date_range.end}`);
      
      // Check if EMA200 is present
      const hasEMA = data.candles.some(candle => candle.ema200 !== null && candle.ema200 !== undefined);
      console.log(`   EMA200 indicator: ${hasEMA ? '✅ Present' : '⚠️  Not calculated'}`);
    } else {
      const errorData = await dataResponse.json();
      console.log('❌ Data endpoint failed:', errorData.detail);
    }
  } catch (error) {
    console.log('❌ Data endpoint request failed:', error.message);
  }

  console.log('\n3️⃣ Testing CORS headers...');
  try {
    const corsResponse = await fetch(`${BASE_URL}/intervals`, {
      method: 'OPTIONS'
    });
    console.log('CORS preflight status:', corsResponse.status);
    console.log('CORS headers:', {
      'access-control-allow-origin': corsResponse.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': corsResponse.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': corsResponse.headers.get('access-control-allow-headers')
    });
  } catch (error) {
    console.log('CORS test failed:', error.message);
  }

  console.log('\n4️⃣ Testing intervals endpoint...');
  try {
    const intervalsResponse = await fetch(`${BASE_URL}/intervals`);
    if (intervalsResponse.ok) {
      const intervalsData = await intervalsResponse.json();
      console.log('✅ Intervals endpoint working');
      console.log('   Supported intervals:', Object.keys(intervalsData.intervals));
    } else {
      console.log('❌ Intervals endpoint failed');
    }
  } catch (error) {
    console.log('❌ Intervals endpoint request failed:', error.message);
  }

  console.log('\n5️⃣ Testing with different symbols...');
  const testSymbols = ['GBPUSD', 'USDJPY'];
  
  for (const symbol of testSymbols) {
    try {
      const response = await fetch(`${BASE_URL}/get-data?symbol=${symbol}&interval=1h`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${symbol}: ${data.candles.length} candles`);
      } else {
        const errorData = await response.json();
        console.log(`❌ ${symbol}: ${errorData.detail}`);
      }
    } catch (error) {
      console.log(`❌ ${symbol}: Request failed - ${error.message}`);
    }
  }

  console.log('\n6️⃣ Testing browser fetch compatibility...');
  try {
    // Test if fetch is available and working
    const testResponse = await fetch('https://httpbin.org/get');
    if (testResponse.ok) {
      console.log('✅ Browser fetch is working');
    } else {
      console.log('❌ Browser fetch test failed');
    }
  } catch (error) {
    console.log('❌ Browser fetch not available:', error.message);
  }
}

// Run the debug
debugAPI().then(() => {
  console.log('\n🎯 Debug complete! Check the results above.');
}).catch(error => {
  console.error('Debug failed:', error);
}); 