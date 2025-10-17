/**
 * Adsterra Ad Configuration
 * 
 * Replace these with your actual Adsterra ad codes after account approval
 * Get your codes from: https://adsterra.com -> Dashboard -> Get Code
 */

export const adConfig = {
  // Social Bar for Customer Dashboard
  socialBar: {
    enabled: process.env.REACT_APP_ADS_ENABLED === 'true',
    scriptSrc: process.env.REACT_APP_ADSTERRA_SOCIAL_BAR_SRC || '',
    containerId: 'adsterra-social-bar',
    atOptions: {
      key: process.env.REACT_APP_ADSTERRA_SOCIAL_BAR_KEY || '',
      format: 'iframe',
      height: 50,
      width: 320,
      params: {}
    }
  },

  // Native Banner for Login Page
  nativeBanner: {
    enabled: process.env.REACT_APP_ADS_ENABLED === 'true',
    scriptSrc: process.env.REACT_APP_ADSTERRA_NATIVE_BANNER_SRC || '',
    containerId: 'adsterra-native-banner',
    atOptions: {
      key: process.env.REACT_APP_ADSTERRA_NATIVE_BANNER_KEY || '',
      format: 'iframe',
      height: 250,
      width: 300,
      params: {}
    }
  },

  // Popunder for Public Coupon Pages
  popunder: {
    enabled: process.env.REACT_APP_ADS_ENABLED === 'true',
    scriptSrc: process.env.REACT_APP_ADSTERRA_POPUNDER_SRC || '',
    containerId: 'adsterra-popunder'
  },

  // Banner for various placements
  banner: {
    enabled: process.env.REACT_APP_ADS_ENABLED === 'true',
    scriptSrc: process.env.REACT_APP_ADSTERRA_BANNER_SRC || '',
    containerId: 'adsterra-banner',
    atOptions: {
      key: process.env.REACT_APP_ADSTERRA_BANNER_KEY || '',
      format: 'iframe',
      height: 90,
      width: 728,
      params: {}
    }
  }
};

export default adConfig;
