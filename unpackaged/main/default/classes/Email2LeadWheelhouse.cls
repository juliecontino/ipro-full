global class Email2LeadWheelhouse implements Messaging.InboundEmailHandler {

    global Messaging.InboundEmailResult handleInboundEmail(Messaging.inboundEmail email, Messaging.InboundEnvelope env) {
  
  

      
        //Do not worry about this. result returned only for Salesforce Email Service process

        Messaging.InboundEmailResult result = new Messaging.InboundEmailResult();
        
        
// Captures the sender's email address
//String emailAddress = env.fromAddress;
//Commented out above because the from address is a long amazon cloud email agent that is too long for the field
String emailAddress = 'leads@wheelhousecorp.com';
 
// Retrieves the sender's first and last names
String fName = email.fromname.substring(0,email.fromname.indexOf(' '));
String lName = email.fromname.substring(email.fromname.indexOf(' '));


  
//String[] emailBody = email.htmlbody.split('\n', 0);

//html-rtf formatted
//String leadsourcecomments = email.subject;
//String leadnumber = emailBody[16].substring(0);
//String leadfName = emailBody[40].substring(15);
//String leadlName = emailBody[44].substring(0);
//String leademail = emailBody[32].substring(0);
//String phoneNumber = emailBody[36].substring(0);
//String company = emailBody[40].substring(0);
//String city= emailBody[44].substring(0);
//String state= emailBody[48].substring(0);
//String Zip= emailBody[52].substring(0);
//String industry= emailBody[64].substring(0);
//String title= emailBody[60].substring(0);
//String EmployeeCount= emailBody[56].substring(0);
//String notes= emailBody[72].substring(0);
//string FullDesc = notes + '- Employeee Count ' + employeecount;
string FullDesc = email.htmlbody;




        
        
        
        //Instantiate New Lead Object
        Lead newLead = new Lead();
        
        //add details
        //newLead.email = leademail;
        newLead.email = emailaddress;
        //newLead.FirstName = leadfname;
        //newLead.LastName = leadlName;
        newLead.FirstName = fname;
        newLead.LastName = lname;
        newLead.Description = 'Inbound Email from: ' +  fname + ' ' + lname + ' ' + emailAddress;
        //newLead.Description = FullDesc;
        newLead.EmailBodyText__c = FullDesc;
        newLead.company = 'company';
        newLead.leadsource = 'Wheelhouse';
        //newLead.Phone = phonenumber;
        //newLead.Lead_Source_Comments__c = leadsourcecomments;
        //newLead.Lead_Source_Reference__c = leadnumber ;
        //newLead.city = city;
        //newLead.state = state;
        //newLead.postalcode= zip;
        //newLead.title= title;
        //newLead.industry= industry;
        //newLead.NumberofEmployees= employeecount;
        
        
        
        
        //insert new lead
        
      //  try {
            //Insert New Lead
    //        Database.insert(newLead);
  //      }
   //     catch(Exception e) {
   //         System.debug('Exception in new Email2Lead'+e);
  //      }

        return result;
    //    
        
    }
}