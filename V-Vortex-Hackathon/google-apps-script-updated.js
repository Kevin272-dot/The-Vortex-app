// Google Apps Script for V-VORTEX Registration Data
// Deploy this as a Web App and copy the URL to your Supabase Edge Function environment variable

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registrations');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Registrations');
      
      // Set up headers
      newSheet.getRange('A1:N1').setValues([[
        'Timestamp',
        'Team Name',
        'Team Size',
        'VIT Chennai',
        'Institution',
        'Leader Name',
        'Leader Reg No',
        'Leader Email',
        'Receipt Link',
        'Member 1 Name',
        'Member 1 Email',
        'Member 2 Name',
        'Member 2 Email',
        'Member 3 Name',
        'Member 3 Email'
      ]]);
      
      // Format header
      newSheet.getRange('A1:N1').setBackground('#00e6ff').setFontWeight('bold');
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Sheet created' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = JSON.parse(e.postData.contents);
    
    // Prepare member data (up to 3 members)
    const member1Name = data.members?.[0]?.name || '';
    const member1Email = data.members?.[0]?.email || '';
    const member2Name = data.members?.[1]?.name || '';
    const member2Email = data.members?.[1]?.email || '';
    const member3Name = data.members?.[2]?.name || '';
    const member3Email = data.members?.[2]?.email || '';
    
    // Prepare row data
    const rowData = [
      data.timestamp || new Date().toISOString(),
      data.teamName || '',
      data.teamSize || '',
      data.isVitChennai === 'yes' ? 'Yes' : 'No',
      data.institution || 'VIT Chennai',
      data.leaderName || '',
      data.leaderReg || 'N/A',
      data.leaderEmail || '',
      data.receiptLink || '',
      member1Name,
      member1Email,
      member2Name,
      member2Email,
      member3Name,
      member3Email
    ];
    
    // Append row
    sheet.appendRow(rowData);
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, 15);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function to verify setup
function testWebhook() {
  const testData = {
    timestamp: new Date().toISOString(),
    teamName: 'Test Team',
    teamSize: 3,
    isVitChennai: 'yes',
    institution: 'VIT Chennai',
    leaderName: 'John Doe',
    leaderReg: '22BCS1234',
    leaderEmail: 'john@vit.ac.in',
    receiptLink: 'https://drive.google.com/file/test',
    members: [
      { name: 'Jane Smith', email: 'jane@vit.ac.in', reg: '22BCS1235' },
      { name: 'Bob Wilson', email: 'bob@vit.ac.in', reg: '22BCS1236' }
    ]
  };
  
  const e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(e);
  Logger.log(result.getContent());
}
