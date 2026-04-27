import api from './api';

export const analyticsService = {

 getSummary: async (range = '30') => {
    try {
      const response = await api.get(`/analytics/summary?range=${range}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      return {
        summary: {
          completionRate: 0,
          productiveHours: 0,
          focusScore: 0,
          streak: 0,
          totalTasks: 0,
          completedTasks: 0
        }
      };
    }
  },

  getTrends: async (range = '30') => {
    try {
      const response = await api.get(`/analytics/trends?range=${range}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trends:', error);
      return { trends: [] };
    }
  },

  getCategoryDistribution: async (range = '30') => {
    try {
      const response = await api.get(`/analytics/categories?range=${range}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category distribution:', error);
      return { distribution: [] };
    }
  },

  getCategoryTime: async (range = '30') => {
    try {
      const response = await api.get(`/analytics/category-time?range=${range}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category time:', error);
      return { categoryTime: [] };
    }
  },

  getTimeAnalysis: async (range = '30') => {
    try {
      const response = await api.get(`/analytics/time-analysis?range=${range}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching time analysis:', error);
      return { analysis: [] };
    }
  },

  getForecast: async (metric = 'productiveHours', period = '7') => {
    try {
      const response = await api.get(`/analytics/forecast?metric=${metric}&period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      return { historical: [], forecast: [] };
    }
  },

  exportData: async (format = 'pdf', range = '30') => {
    try {
      let endpoint;
      
      switch (format) {
        case 'csv':
          endpoint = '/analytics/export/csv';
          break;
        case 'json':
          endpoint = '/analytics/export/json';
          break;
        case 'pdf':
        default:
          endpoint = '/analytics/export/text';
      }
      
      const response = await api.get(`${endpoint}?range=${range}`, {
        responseType: format === 'json' ? 'json' : 'blob'
      });
      
      // Create download
      const blob = format === 'json' 
        ? new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
        : response.data;
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `productivity-report-${new Date().toISOString().split('T')[0]}.${
        format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'txt'
      }`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
,


  getProductivityData: async (range = '30') => {
    try {
      const response = await api.get(`/analytics/productivity?range=${range}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching productivity data:', error);
      return { data: [] };
    }
  },

};




// // src/services/analytics.js
// import api from './api'

// export const analyticsService = {


//   getCategories: async (range = '30') => {
//     const response = await api.get('/analytics/categories', { params: { range } }) // Fixed endpoint
//     return response.data
//   },

//  getSummary: async (range = '30') => {
//     try {
//       const response = await api.get(`/analytics/summary?range=${range}`);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching analytics summary:', error);
//       throw error;
//     }
//   },

//   getTrends: async (range = '30') => {
//     try {
//       const response = await api.get(`/analytics/trends?range=${range}`);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching trends:', error);
//       throw error;
//     }
//   },

//   getCategoryDistribution: async (range = '30') => {
//     try {
//       const response = await api.get(`/analytics/categories?range=${range}`);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching category distribution:', error);
//       throw error;
//     }
//   },

//   getTimeAnalysis: async (range = '30') => {
//     try {
//       const response = await api.get(`/analytics/time-analysis?range=${range}`);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching time analysis:', error);
//       throw error;
//     }
//   },

//   getForecast: async (metric = 'productiveHours', period = '7') => {
//     try {
//       const response = await api.get(`/analytics/forecast?metric=${metric}&period=${period}`);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching forecast:', error);
//       throw error;
//     }
//   },

//   getCategoryTime: async (range = '30') => {
//     try {
//       const response = await api.get(`/analytics/category-time?range=${range}`);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching category time:', error);
//       throw error;
//     }
//   },

//   exportData: async (format = 'csv', range = '30') => {
//     try {
//       const response = await api.get(`/analytics/export?format=${format}&range=${range}`, {
//         responseType: format === 'pdf' ? 'blob' : 'json'
//       });
//       return response.data;
//     } catch (error) {
//       console.error('Error exporting data:', error);
//       throw error;
//     }
//   }
// ,
 

//   exportCSV: async (range = '30') => {
//     const response = await api.get('/reports/export.csv', { 
//       params: { range },
//       responseType: 'blob'
//     }) // Fixed endpoint
//     return response.data
//   },

//   exportJSON: async (range = '30') => {
//     const response = await api.get('/reports/export.json', { 
//       params: { range },
//       responseType: 'blob'
//     }) // Fixed endpoint
//     return response.data
//   },

//   exportPDF: async (range = '30') => {
//     const response = await api.get('/reports/export.pdf', { 
//       params: { range },
//       responseType: 'blob'
//     }) // Fixed endpoint
//     return response.data
//   }
  
// }