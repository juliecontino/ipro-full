/*
	Purpose: Simplify the account search from AP based on account number

	07/06/2016  MD@IC  Created (00132544)
	07/13/2016  MD@IC  Populate Access Circuit lookup & payee ref (00132544)
*/
public class LookupAccountNumberCtrl{

	public AcctSeed__Account_Payable__c accountPayable{get;set;}
	public List<Access_Circuits__c> accessCircuits{ get{return accessCircuitMap.values();} set; }
	public Map<Id, Access_Circuits__c> accessCircuitMap{get;set;}
	public String accountNumber{get;set;}
	public String selectedAccessCircuit{get;set;}
	public List<Schema.FieldSetMember> fieldSet{get;set;}
	public String AC_LIMIT{get;set;}

	public Boolean newPageOverride{get;set;}

	public LookupAccountNumberCtrl(ApexPages.StandardController ctrl){
		accessCircuitMap = new Map<Id, Access_Circuits__c>();
		fieldSet = Schema.SObjectType.Access_Circuits__c.fieldSets.getMap().get('Lookup_Account_Number').getFields();

		newPageOverride = false;
		Map<String, String> params = ApexPages.currentPage().getParameters();
		AC_LIMIT = String.isNotBlank(params.get('limit')) ? params.get('limit') : '500';

		if(params.get('sfdc.override') == '1'){
			newPageOverride = true;
		}
		else{
			String apId = ApexPages.currentPage().getParameters().get('apid');
			if(String.isBlank(apId)) ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'No Account Payable Id specified'));
			else{
				List<AcctSeed__Account_Payable__c> accountPayables = [SELECT Id, Name, Client__c FROM AcctSeed__Account_Payable__c WHERE Id = :apId];
				if(accountPayables.isEmpty()) ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'No Account Payable found'));
				else{
					accountPayable = accountPayables[0];
					if(accountPayable.Client__c != null) ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.WARNING, 'This Account Payable already has a client'));
				}
			}
		}
	}

	/*public LookupAccountNumberCtrl(){
		accessCircuits = new List<Access_Circuits__c>();
		fieldSet = Schema.SObjectType.Access_Circuits__c.fieldSets.getMap().get('Lookup_Account_Number').getFields();

		String apId = ApexPages.currentPage().getParameters().get('apid');
		if(String.isBlank(apId)) ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'No Account Payable Id specified'));
		else{
			List<AcctSeed__Account_Payable__c> accountPayables = [SELECT Id, Name, Client__c FROM AcctSeed__Account_Payable__c WHERE Id = :apId];
			if(accountPayables.isEmpty()) ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'No Account Payable found'));
			else{
				accountPayable = accountPayables[0];
				if(accountPayable.Client__c != null) ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.WARNING, 'This Account Payable already has a client'));
			}
		}
	}*/

	public PageReference selectAccessCircuit(){
		if(String.isBlank(selectedAccessCircuit)) ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'No Access Circuit specified'));
		else{
			try{
				if(newPageOverride){
					String url = '/a0S/e?';
					Map<String, String> params = ApexPages.currentPage().getParameters();
					/*for(String s : params.keySet())
						url += s + '=' + params.get(s) + '&';*/
					url += 'retURL=' + params.get('retURL') + '&';
					
					// populate account
					/*Account a = [SELECT Id, Name FROM Account WHERE Id = :selectedAccessCircuit];
					url += 'CF00N40000003JozA_lkid=' + selectedAccessCircuit + '&CF00N40000003JozA=' + EncodingUtil.urlEncode(a.Name, 'UTF-8') + '&nooverride=1';*/
					
					Access_Circuits__c ac = accessCircuitMap.get(selectedAccessCircuit);
					if(ac != null){
						Account a = [SELECT Id, Name FROM Account WHERE Id = :ac.Account__c];
						url += 'CF00N40000003JozA_lkid=' + a.Id + '&CF00N40000003JozA=' + EncodingUtil.urlEncode(a.Name, 'UTF-8') + '&';

						// populate payee referance
						url += '00N40000003JevH=' + ac.Primary_Carrier_Account_Number__c + '&';

						// populate access circuit
						//production
						url += '&CF00N40000002rTuk_lkid=' + selectedAccessCircuit + '&CF00N40000002rTuk=' + EncodingUtil.urlEncode(ac.Name, 'UTF-8') + '&';
						// sandbox - until it gets refreshed
						//url += 'CF00N1b000000ToDn_lkid=' + selectedAccessCircuit + '&CF00N1b000000ToDn=' + EncodingUtil.urlEncode(ac.Name, 'UTF-8') + '&';

						// populate ap access circuit number
						//production
						url += '00N40000002rTv9=' + ac.Primary_Carrier_Account_Number__c + '&';
						// sandbox - until it gets refreshed
						//url += '00N1b000000ToDm=' + ac.Primary_Carrier_Account_Number__c + '&';

						// populate vendor
						if(ac.Circuit_Vendor__c != null)
							url += 'CF00N40000003JevN_lkid=' + ac.Circuit_Vendor__c + '&CF00N40000003JevN=' + EncodingUtil.urlEncode(ac.Circuit_Vendor__r.Name, 'UTF-8') + '&';

						url += 'nooverride=1';
					}
					return new PageReference(url);
				}
				else if(accountPayable != null){
					//accountPayable.Client__c = selectedAccessCircuit;
					Access_Circuits__c ac = accessCircuitMap.get(selectedAccessCircuit);
					if(ac != null){
						accountPayable.Client__c = ac.Account__c;
						update accountPayable;
					}
					return cancel();
				}
			}
			catch(Exception e){
				System.debug('Exception in LookupAccountNumberCtrl.cls: ' + e.getMessage() + ' @ ' + e.getStackTraceString());
				ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, e.getMessage() + ' @ ' + e.getStackTraceString() ));
			}
		}
		return null;
	}

	public PageReference cancel(){
		if(accountPayable != null)
			return new PageReference('/' + accountPayable.Id);
		//return new PageReference(ApexPages.currentPage().getParameters().get('vfRetURLInSFX'));
		return new PageReference(ApexPages.currentPage().getParameters().get('retURL'));
	}

	public PageReference skip(){
		String url = '/a0S/e?nooverride=1';
		Map<String, String> params = ApexPages.currentPage().getParameters();
		if(params.containsKey('retURL'))
			url += '&retURL=' + params.get('retURL');
		return new PageReference(url);
	}

	@remoteAction
	public static List<String> searchAccountNumbers(String searchTerm){
		searchTerm = '%' + searchTerm + '%';
		List<AggregateResult> result = [SELECT Primary_Carrier_Account_Number__c FROM Access_Circuits__c WHERE Primary_Carrier_Account_Number__c LIKE :searchTerm GROUP BY Primary_Carrier_Account_Number__c ORDER BY Primary_Carrier_Account_Number__c ASC LIMIT 25];
		List<String> returnVal = new List<String>();
		for(AggregateResult r : result)
			returnVal.add((String)r.get('Primary_Carrier_Account_Number__c'));
		return returnVal;
	}

	public void queryAccessCircuits(){
		if(String.isNotBlank(accountNumber)){
			Set<String> fields = new Set<String>{'Id', 'Account__c', 'Primary_Carrier_Account_Number__c', 'Account__r.Name', 'Circuit_Vendor__c', 'Circuit_Vendor__r.Name'};
			for(Schema.FieldSetMember f : fieldSet)
				fields.add(f.getFieldPath());
			//accessCircuits = Database.query('SELECT ' + String.join(new List<String>(fields), ',') + ' FROM Access_Circuits__c WHERE Primary_Carrier_Account_Number__c = \'' + accountNumber + '\'');
			accessCircuitMap = new Map<Id, Access_Circuits__c>((List<Access_Circuits__c>)Database.query('SELECT ' + String.join(new List<String>(fields), ',') + ' FROM Access_Circuits__c WHERE Primary_Carrier_Account_Number__c = \'' + accountNumber + '\' ORDER BY Account__r.Name ASC LIMIT ' + AC_LIMIT));
		}
	}
}