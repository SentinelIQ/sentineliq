const PLAUSIBLE_API_KEY = process.env.PLAUSIBLE_API_KEY;
const PLAUSIBLE_SITE_ID = process.env.PLAUSIBLE_SITE_ID || 'sentineliq.com.br';
const PLAUSIBLE_BASE_URL = process.env.PLAUSIBLE_BASE_URL || 'https://plausible.io';
const ANALYTICS_ENABLED = process.env.ANALYTICS_ENABLED === 'true';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${PLAUSIBLE_API_KEY || ''}`,
};

/**
 * Check if Plausible is properly configured
 */
function isPlausibleConfigured(): boolean {
  return !!(PLAUSIBLE_API_KEY && PLAUSIBLE_SITE_ID && ANALYTICS_ENABLED);
}

/**
 * Generate mock analytics data for development
 */
function getMockAnalytics() {
  const baseViews = 1250;
  const randomVariation = Math.floor(Math.random() * 200) - 100; // -100 to +100
  const totalViews = baseViews + randomVariation;
  const changePercent = (Math.random() * 30 - 5).toFixed(0); // -5% to +25%
  
  return {
    totalViews,
    prevDayViewsChangePercent: changePercent,
  };
}

/**
 * Generate mock sources data for development
 */
function getMockSources() {
  return [
    { source: 'Direct', visitors: 450 + Math.floor(Math.random() * 100) },
    { source: 'Google', visitors: 320 + Math.floor(Math.random() * 80) },
    { source: 'LinkedIn', visitors: 180 + Math.floor(Math.random() * 50) },
    { source: 'Twitter', visitors: 120 + Math.floor(Math.random() * 40) },
    { source: 'Facebook', visitors: 90 + Math.floor(Math.random() * 30) },
    { source: 'GitHub', visitors: 60 + Math.floor(Math.random() * 20) },
  ];
}

type PageViewsResult = {
  results: {
    [key: string]: {
      value: number;
    };
  };
};

type PageViewSourcesResult = {
  results: [
    {
      source: string;
      visitors: number;
    }
  ];
};

export async function getDailyPageViews() {
  // Check if Plausible is configured and enabled
  if (!isPlausibleConfigured()) {
    console.log('📊 Analytics: Using mock data (Plausible not configured)');
    return getMockAnalytics();
  }

  try {
    console.log('📊 Analytics: Fetching real data from Plausible...');
    const totalViews = await getTotalPageViews();
    const prevDayViewsChangePercent = await getPrevDayViewsChangePercent();

    console.log('✅ Analytics: Successfully fetched Plausible data');
    return {
      totalViews,
      prevDayViewsChangePercent,
    };
  } catch (error) {
    console.error('❌ Plausible API error, falling back to mock data:', error);
    return getMockAnalytics();
  }
}

async function getTotalPageViews() {
  const response = await fetch(
    `${PLAUSIBLE_BASE_URL}/api/v1/stats/aggregate?site_id=${PLAUSIBLE_SITE_ID}&metrics=pageviews`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PLAUSIBLE_API_KEY}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  const json = (await response.json()) as PageViewsResult;

  return json.results.pageviews.value;
}

async function getPrevDayViewsChangePercent() {
  // Calculate today, yesterday, and the day before yesterday's dates
  const today = new Date();
  const yesterday = new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0];
  const dayBeforeYesterday = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0];

  // Fetch page views for yesterday and the day before yesterday
  const pageViewsYesterday = await getPageviewsForDate(yesterday);
  const pageViewsDayBeforeYesterday = await getPageviewsForDate(dayBeforeYesterday);

  console.table({
    pageViewsYesterday,
    pageViewsDayBeforeYesterday,
    typeY: typeof pageViewsYesterday,
    typeDBY: typeof pageViewsDayBeforeYesterday,
  });

  let change = 0;
  if (pageViewsYesterday === 0 || pageViewsDayBeforeYesterday === 0) {
    return '0';
  } else {
    change = ((pageViewsYesterday - pageViewsDayBeforeYesterday) / pageViewsDayBeforeYesterday) * 100;
  }
  return change.toFixed(0);
}

async function getPageviewsForDate(date: string) {
  const url = `${PLAUSIBLE_BASE_URL}/api/v1/stats/aggregate?site_id=${PLAUSIBLE_SITE_ID}&period=day&date=${date}&metrics=pageviews`;
  const response = await fetch(url, {
    method: 'GET',
    headers: headers,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  const data = (await response.json()) as PageViewsResult;
  return data.results.pageviews.value;
}

export async function getSources() {
  // Check if Plausible is configured and enabled
  if (!isPlausibleConfigured()) {
    console.log('📊 Analytics Sources: Using mock data (Plausible not configured)');
    return getMockSources();
  }

  try {
    console.log('📊 Analytics Sources: Fetching real data from Plausible...');
    const url = `${PLAUSIBLE_BASE_URL}/api/v1/stats/breakdown?site_id=${PLAUSIBLE_SITE_ID}&property=visit:source&metrics=visitors`;
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = (await response.json()) as PageViewSourcesResult;
    console.log('✅ Analytics Sources: Successfully fetched Plausible data');
    return data.results;
  } catch (error) {
    console.error('❌ Plausible sources API error, falling back to mock data:', error);
    return getMockSources();
  }
}
