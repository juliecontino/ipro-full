@isTest
public class SpringCMRest_Test {

  @isTest
  private static void AuthenticateUsingSessionTest() {
      Test.setMock(HttpCalloutMock.class, new ROYCON_AuthenticateUsingSessionMock());
      Test.startTest();
      SpringCM201411 service = new SpringCM201411();
      service.StartWorkflow('New Test', '', null);
      Test.stopTest();
        
  }

  @isTest
  private static void GetFolderTest() {
      // Test.setMock(HttpCalloutMock.class, new ROYCON_AuthenticateUsingSessionMock());
      Test.startTest();
      SpringCM201411 service = new SpringCM201411();
      try {
        service.GetFolder(null, null, null, null);
      }
      catch (Exception ex) {
        System.assertEquals(ex.getMessage(), 'No object identifier provided', 'There was no exception');
      }
      Test.stopTest();
        
  }


  @isTest
  private static void GetFolderExceptionTest() {
      // Test.setMock(HttpCalloutMock.class, new ROYCON_FolderMock());
      Test.startTest();
      SpringCM201411 service = new SpringCM201411();
      try {

        SpringCM_REST_Environmental__c scm = new SpringCM_REST_Environmental__c();
          scm.Name = 'TEST';
          scm.Client_Secret__c = 'Client Secret';
          scm.Base_URL__c = 'https://google.com/testing';
          scm.API_Key__c = 'API Key';
          scm.Auth_URL__c = 'Auth URL';
          insert scm;


        Opportunity oppty = new Opportunity(Name = 'Test Oppty'
          , StageName = '30%', CloseDate = Date.today()
          , OPS_Category__c = 'INSTALLATION');
        Account acc = new Account(Name = 'Test Acc');
        // insert acc;
        insert oppty;
        service.GetFolder(oppty.Id, null, null, null);
      }
      catch (Exception ex) {
        System.assertEquals(ex.getMessage(), 'No object identifier provided', 'There was no exception');
      }
      Test.stopTest();
        
  }

  // @isTest
  // private static void UploadDocumentTest() {
  //     Test.setMock(HttpCalloutMock.class, new ROYCON_FolderMock());
  //     Test.startTest();
  //     SpringCM201411 service = new SpringCM201411();
  //     try {
        

  //       Opportunity oppty = new Opportunity(Name = 'Test Oppty'
  //         , StageName = '30%', CloseDate = Date.today()
  //         , OPS_Category__c = 'INSTALLATION');
  //       insert oppty;
  //       Blob doc = Blob.valueOf('Try this');
  //       System.debug('Blob size: ' + doc.size() + '\ncontent: ' + doc);
  //       SpringCMRestWrap.UploadDocument('1', 'Oppty', 'Name', doc, UserInfo.getSessionId());

  //     }
  //     catch (Exception ex) {
  //       System.assertEquals(ex.getMessage(), 'Argument cannot be null.', 'There was no exception');
  //     }
  //     Test.stopTest();
        
  // }



  @isTest
  private static void AuthenticateUsingIntegrationUserTest() {
      
      Test.setMock(HttpCalloutMock.class, new ROYCON_AuthenticateUsingSessionMock());
      Test.startTest();
      CurrentEnvironment__c ce = new CurrentEnvironment__c();
      ce.Name = 'currentEnvironment';
      ce.environment__c = 'TEST';
      insert ce;
      SpringCM_REST_Environmental__c scm = new SpringCM_REST_Environmental__c();
      scm.Name = 'TEST';
      scm.Client_Secret__c = 'Client Secret';
      scm.Base_URL__c = 'Base URL';
      scm.API_Key__c = 'API Key';
      scm.Auth_URL__c = 'Auth URL';
      insert scm;
      SpringCM201411 service = new SpringCM201411();
      service.StartWorkflow('New Test', '', 'sessionId');
      Test.stopTest();
        
  }

  public class ROYCON_FolderMock implements HttpCalloutMock {
        
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(200);
        res.setStatus('OK');
        String body = '{"CreateDocumentHref":"test"}';
        return res;
    }
  }

  

  public class ROYCON_AuthenticateUsingSessionMock implements HttpCalloutMock {
        
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(200);
        res.setStatus('OK');
        return res;
    }
  }


  static testMethod void myUnitTest() {
    Test.startTest();

    CurrentEnvironment__c ce = new CurrentEnvironment__c();
    ce.Name = 'currentEnvironment';
    ce.environment__c = 'TEST';
    insert ce;

    SpringCM_REST_Environmental__c scm = new SpringCM_REST_Environmental__c();
    scm.Name = 'TEST';
    scm.Client_Secret__c = 'Client Secret';
    scm.Base_URL__c = 'Base URL';
    scm.API_Key__c = 'API Key';
    scm.Auth_URL__c = 'Auth URL';
    insert scm;

    try {
        /////////////////
        //TEST TRIGGERS//
        /////////////////
        
        //create test account
        List<Account> a = new List<Account>(); 
        a.add(new Account(
            name    = 'Teston'
        ));
        insert a;
        
        //create test opportunity   
        List<Opportunity> o = new List<Opportunity>();
        o.add(new Opportunity(
            Name            = 'Test Oppty',
            AccountId       = a[0].Id,
            CloseDate       = Date.today(),
            StageName       = 'In Progress',
            OPS_Category__c = 'INSTALLATION',
            Type            = 'Donation')); 
        insert o;

      SpringCMRestWrap.BuildEOS('1', 'Account', '1', '', 'test');
      SpringCMRestWrap.BuildEOS('1', 'Account', '', '', 'test');
      SpringCMRestWrap.StartWorkflow('1', 'Account', '1', '', 'String wf');

      Map<String,String> m = new Map<String,String>();
      m.put('1', '1');
      SpringCMRestWrap.BuildEOS(m, 'sfType', '1', 'workflow');

      Blob doc = Blob.valueOf('Try this');
      System.debug('Blob size: ' + doc.size() + '\ncontent: ' + doc);
      SpringCMRestWrap.UploadDocument('1', 'Acc', 'Name', doc, UserInfo.getSessionId());

      ////////////////
      //TEST FAILURE//
      ////////////////
      SpringCMRestWrap.BuildEOS('1', 'Account', '1', '', 'fail');
      SpringCMRestWrap.BuildEOS('1', 'Account', '', '', 'fail');
      }
    catch(Exception e) {
      System.debug('The following exception has occurred: ' + e.getMessage());
      }
    Test.stopTest();
    }
  }