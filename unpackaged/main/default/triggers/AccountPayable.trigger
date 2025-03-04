/*
Created to replace existing processes.
Test Class: AccountingTriggersTest.

01/25/16 BS@IC Created (00126633)
09/01/16 MD@IC Populate Client__c when AP is created from a PO (00135874)
*/

trigger AccountPayable on AcctSeed__Account_Payable__c (before insert, after insert, before update, after update) {
    try {
        //Load settings
        Apex_Code_Settings__c setting = Apex_Code_Settings__c.getOrgDefaults();
    
        if(Trigger.isBefore) {
            Set<Id> poIds = new Set<Id>();
            //Update Vendor for MS Lease Payment
            for(AcctSeed__Account_Payable__c ap : Trigger.New){
                if(ap.AcctSeedERP__Purchase_Order__c != null)
                    poIds.add(ap.AcctSeedERP__Purchase_Order__c);
                if(String.isNotBlank(setting.Texas_Star_Bank_Id__c) && ap.MS_Lease_Payment__c == true && ap.AcctSeed__Status__c != 'Posted' && (Trigger.isInsert || Trigger.oldMap.get(ap.Id).MS_Lease_Payment__c != true))
                    ap.AcctSeed__Vendor__c = setting.Texas_Star_Bank_Id__c;
            }

            Map<Id, AcctSeedERP__Purchase_Order__c> purchaseOrders = new Map<Id, AcctSeedERP__Purchase_Order__c>([SELECT Id, Account__c FROM AcctSeedERP__Purchase_Order__c WHERE Id IN :poIds]);
            for(AcctSeed__Account_Payable__c ap : Trigger.New){
                if(ap.AcctSeedERP__Purchase_Order__c != null && purchaseOrders.containsKey(ap.AcctSeedERP__Purchase_Order__c))
                    ap.Client__c = purchaseOrders.get(ap.AcctSeedERP__Purchase_Order__c).Account__c;
            }
        }
        else { //After
            //Query additional Account Payable fields
            Map<Id, AcctSeed__Account_Payable__c> apById = new Map<Id, AcctSeed__Account_Payable__c>([
                SELECT AcctSeed__Total__c, Client__r.Branch__c, Client__r.Account_Executive__c
                FROM AcctSeed__Account_Payable__c
                WHERE Id IN :Trigger.newMap.keySet()
            ]);
        
            //Lines to be inserted
            AcctSeed__Account_Payable_Line__c[] newLines = new AcctSeed__Account_Payable_Line__c[]{};
            
            for(AcctSeed__Account_Payable__c ap : Trigger.new) {
                //AP Lines for Client Telephone Bill
                if(ap.Client_Telephone_Bill__c == true && ap.Client__c != null && ap.AcctSeed__Status__c != 'Posted' && apById.get(ap.Id).AcctSeed__Total__c == 0 && 
                   (Trigger.isInsert || Trigger.oldMap.get(ap.Id).Client_Telephone_Bill__c != true || Trigger.oldMap.get(ap.Id).Client__c == null)) {
                   
                    //Line 1
                    if(String.isNotBlank(setting.GL_16021_Id__c)) {
                        newLines.add(new AcctSeed__Account_Payable_Line__c(
                            AcctSeed__Account_Payable__c = ap.Id,
                            AcctSeed__Amount__c = 0,
                            AcctSeed__Expense_GL_Account__c = setting.GL_16021_Id__c, //16021 - C/S-MS-ACCESS
                            AcctSeed__GL_Account_Variable_1__c = apById.get(ap.Id).Client__r.Branch__c,
                            AcctSeed__GL_Account_Variable_2__c = apById.get(ap.Id).Client__r.Account_Executive__c,
                            AcctSeed__Quantity__c = 1
                        ));
                    }
        
                    //Line 2
                    if(String.isNotBlank(setting.GL_16023_Id__c) && String.isNotBlank(setting.Misc_Taxes_Surcharges_and_Fees_Id__c)) {
                        newLines.add(new AcctSeed__Account_Payable_Line__c(
                            AcctSeed__Account_Payable__c = ap.Id,
                            AcctSeed__Amount__c = 0,
                            AcctSeed__Expense_GL_Account__c = setting.GL_16023_Id__c, //16023 - C/S-MS-TAXES & FEES
                            AcctSeed__GL_Account_Variable_1__c = apById.get(ap.Id).Client__r.Branch__c,
                            AcctSeed__GL_Account_Variable_2__c = apById.get(ap.Id).Client__r.Account_Executive__c,
                            AcctSeed__Product__c = setting.Misc_Taxes_Surcharges_and_Fees_Id__c,
                            AcctSeed__Quantity__c = 1
                        ));
                    }
        
                    //Line 3
                    if(String.isNotBlank(setting.GL_13240_Id__c) && String.isNotBlank(setting.Texas_Sales_Tax_Id__c)) {
                        newLines.add(new AcctSeed__Account_Payable_Line__c(
                            AcctSeed__Account_Payable__c = ap.Id,
                            AcctSeed__Amount__c = 0,
                            AcctSeed__Expense_GL_Account__c = setting.GL_13240_Id__c, //13240.01 - MS - TEXAS SALES TAX - PAYABLE
                            AcctSeed__GL_Account_Variable_1__c = apById.get(ap.Id).Client__r.Branch__c,
                            AcctSeed__GL_Account_Variable_2__c = apById.get(ap.Id).Client__r.Account_Executive__c,
                            AcctSeed__Product__c = setting.Texas_Sales_Tax_Id__c,
                            AcctSeed__Quantity__c = 1
                        ));
                    }
                }
                
                //AP Line for MS Lease Payment
                if(String.isNotBlank(setting.GL_14020_Id__c) && ap.MS_Lease_Payment__c == true && ap.AcctSeed__Status__c != 'Posted' && (Trigger.isInsert || Trigger.oldMap.get(ap.Id).MS_Lease_Payment__c != true)) {
                    newLines.add(new AcctSeed__Account_Payable_Line__c(
                        AcctSeed__Account_Payable__c = ap.Id,
                        AcctSeed__Amount__c = 0,
                        AcctSeed__Expense_GL_Account__c = setting.GL_14020_Id__c, //14020 - SALES-MS-SERVICES
                        AcctSeed__Quantity__c = 1
                    ));
                }
            }

            if(!newLines.isEmpty())
                for(Database.SaveResult result : Database.insert(newLines, false))
                    if(!result.isSuccess())
                        for(Database.Error err : result.getErrors())
                            System.debug(err.getMessage());
        }
    }
    catch(Exception e) {
        System.debug('AccountPayable threw: ' + e.getMessage() + ' @ ' + e.getStackTraceString());
    }
}