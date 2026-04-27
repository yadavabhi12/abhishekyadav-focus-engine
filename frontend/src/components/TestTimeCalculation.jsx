// src/components/TestTimeCalculation.jsx
import React from 'react';

const TestTimeCalculation = () => {
  const testTimeCalculation = () => {
    // Test cases for time calculation
    const testCases = [
      { startTime: '09:00', endTime: '10:30', expected: 90 },
      { startTime: '14:00', endTime: '15:45', expected: 105 },
      { startTime: '23:00', endTime: '01:30', expected: 150 }, // Crosses midnight
      { startTime: '10:00', endTime: '10:00', expected: 0 }, // Same time
      { startTime: '09:15', endTime: '09:50', expected: 35 }, // Your example
    ];

    console.log('=== Time Calculation Tests ===');
    
    testCases.forEach((testCase, index) => {
      const [startHours, startMinutes] = testCase.startTime.split(':').map(Number);
      const [endHours, endMinutes] = testCase.endTime.split(':').map(Number);
      
      let totalStartMinutes = startHours * 60 + startMinutes;
      let totalEndMinutes = endHours * 60 + endMinutes;
      
      // Handle cases where end time might be on the next day
      if (totalEndMinutes < totalStartMinutes) {
        totalEndMinutes += 24 * 60; // Add 24 hours
      }
      
      const minutesSpent = totalEndMinutes - totalStartMinutes;
      
      console.log(`Test ${index + 1}:`);
      console.log(`Start: ${testCase.startTime}, End: ${testCase.endTime}`);
      console.log(`Calculated: ${minutesSpent} minutes, Expected: ${testCase.expected} minutes`);
      console.log(`Result: ${minutesSpent === testCase.expected ? 'PASS' : 'FAIL'}`);
      
      if (minutesSpent !== testCase.expected) {
        console.error(`❌ Test ${index + 1} FAILED!`);
      } else {
        console.log(`✅ Test ${index + 1} PASSED!`);
      }
      console.log('---');
    });
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px', background: '#f5f5f5' }}>
      <h3>Time Calculation Test</h3>
      <p>This component tests the time calculation logic used when toggling task completion.</p>
      <button 
        onClick={testTimeCalculation}
        style={{ padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Run Time Calculation Tests
      </button>
      <p>Check browser console for test results</p>
      
      <div style={{ marginTop: '15px', padding: '10px', background: '#e9ecef', borderRadius: '4px' }}>
        <h4>Test Cases:</h4>
        <ul style={{ textAlign: 'left' }}>
          <li>09:00 to 10:30 = 90 minutes</li>
          <li>14:00 to 15:45 = 105 minutes</li>
          <li>23:00 to 01:30 = 150 minutes (crosses midnight)</li>
          <li>10:00 to 10:00 = 0 minutes</li>
          <li>09:15 to 09:50 = 35 minutes (your example)</li>
        </ul>
      </div>
    </div>
  );
};

export default TestTimeCalculation;