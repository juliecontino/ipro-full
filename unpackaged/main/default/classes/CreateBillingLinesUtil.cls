/*
    Purpose: When a Billing is Created and is related to a recurring billing record, pass through Account Payable Lines should be captured as billing lines.

    10/12/2015  MD@IC  Initial creation (00121705)
*/
public class CreateBillingLinesUtil{

    public static void createLines(Map<Id, AcctSeed__Billing__c> billingMap){
        BillingLineSalesTaxTriggerUtil.bulkNote = true;
        BillingLineSalesTaxTriggerUtil.run = false;
        System.debug('[MD] start');
     
        List<AcctSeed__Billing_Line__c> billingLinesToInsert = new List<AcctSeed__Billing_Line__c>();
        // get all customer Ids - so you can query the AP lines
        Map<Id, List<AcctSeed__Account_Payable_Line__c>> customerIdToAPLines = new Map<Id, List<AcctSeed__Account_Payable_Line__c>>();
        Set<Id> customers = new Set<Id>();
        for(AcctSeed__Billing__c b : billingMap.values()){
            customers.add(b.AcctSeed__Customer__c);
            customerIdToAPLines.put(b.AcctSeed__Customer__c, new List<AcctSeed__Account_Payable_Line__c>());
        }

        // QUery all Account Payable Lines where Billable is True, APLine.Client = Billing.Customer and APLine.BillingLine is blank and APLine.Parent_Status is posted
        List<AcctSeed__Account_Payable_Line__c> apLines = [SELECT Id, AcctSeed__Account_Payable__r.AcctSeed__Payee_Reference__c, AcctSeed__Product__r.AcctSeed__Accounting_Type__c, AcctSeed__Product__r.Name, Client__c, AcctSeed__Quantity__c, AcctSeed__Amount__c, AcctSeed__Product__c, AcctSeed__Product__r.AcctSeed__Revenue_GL_Account__c, AcctSeed__GL_Account_Variable_1__c, AcctSeed__GL_Account_Variable_2__c
                                                           FROM AcctSeed__Account_Payable_Line__c 
                                                           WHERE AcctSeed__Billable__c = true
                                                             AND AcctSeed__Parent_Status__c = 'Posted' 
                                                             AND Client__c IN :customers 
                                                             AND Billing_Line__c = ''];
        for(AcctSeed__Account_Payable_Line__c l : apLines){
            customerIdToAPLines.get(l.Client__c).add(l);
        }

        System.debug('[MD] apLines = ' + apLines);

        // Create a Billing Line for each AP LIne:
        // Billing Line Quantity = AP Line Quantity (if blank or 0, make =1)
        // Product = Product
        // Billing Line Rate = APLine.Total                                     <-- ?
        // Billing Line Revenue GL = Product.Revenue GL                         <-- Product should also be required
        // Billing Line Accounting Variable 1 = AP Line Accounting Variable 1   <--| AcctSeed__Accounting_Variable__c
        // Billing Line Accounting Variable 2 = AP Line Accounting Variable 2   <--|

        List<AcctSeed__Account_Payable_Line__c> apLinesToUpdate = new List<AcctSeed__Account_Payable_Line__c>();
        List<Product2> passThroughProduct = [SELECT Id, AcctSeed__Revenue_GL_Account__c FROM Product2 WHERE PassThrough_Taxes__c = true];

        // for each billing record
        for(AcctSeed__Billing__c b : billingMap.values()){
            // for each apl related to the customer
            for(AcctSeed__Account_Payable_Line__c apl : customerIdToAPLines.get(b.AcctSeed__Customer__c)){
                // check for the required fields
                if(String.isNotBlank(apl.AcctSeed__Product__c) && String.isNotBlank(apl.AcctSeed__Product__r.AcctSeed__Revenue_GL_Account__c)){
                    // && String.isNotBlank(apl.AcctSeed__Total__c)
                    AcctSeed__Billing_Line__c l = new AcctSeed__Billing_Line__c(
                        AcctSeed__Billing__c = b.Id,
                        AcctSeed__Hours_Units__c = (String.isBlank(String.valueOf(apl.AcctSeed__Quantity__c)) || apl.AcctSeed__Quantity__c == 0 ? 1 : apl.AcctSeed__Quantity__c),
                        AcctSeed__Product__c = apl.AcctSeed__Product__c,
                        //AcctSeed__Rate__c = apl.Total,
                        AcctSeed__Rate__c = apl.AcctSeed__Amount__c,
                        AcctSeed__Revenue_GL_Account__c = apl.AcctSeed__Product__r.AcctSeed__Revenue_GL_Account__c,
                        AcctSeed__GL_Account_Variable_1__c = apl.AcctSeed__GL_Account_Variable_1__c,
                        AcctSeed__GL_Account_Variable_2__c = apl.AcctSeed__GL_Account_Variable_2__c,
                        RB_Invoice_Line_Description__c = apl.AcctSeed__Product__r.Name + ' / ' + apl.AcctSeed__Account_Payable__r.AcctSeed__Payee_Reference__c
                    );
                    if(apl.AcctSeed__Product__r.AcctSeed__Accounting_Type__c == 'Tax Rate'){
                        l.AcctSeed__Product__c = passThroughProduct[0].Id;
                        l.AcctSeed__Revenue_GL_Account__c = passThroughProduct[0].AcctSeed__Revenue_GL_Account__c;
                    }
                    billingLinesToInsert.add(l);
                    apLinesToUpdate.add(apl);
                }
            }
        }
        
        System.debug('[MD] billingLinesToInsert = ' + billingLinesToInsert);

        System.debug('[MD] billing lines = ' + billingLinesToInsert.size());
        System.debug('[MD] ap lines = ' + apLinesToUpdate.size());
        

        if(!billingLinesToInsert.isEmpty()){
            BillingLineSalesTaxTriggerUtil.run = false;
            BillingLineSalesTaxTriggerUtil.bulkNote = true;
            insert billingLinesToInsert;
            System.debug('[MD] post insert: ' + billingLinesToInsert[0].Id);
            // Update the AP Line. Billing Line lookup
            for(Integer i = 0; i < billingLinesToInsert.size(); i++)
                apLinesToUpdate[i].Billing_Line__c = billingLinesToInsert[i].Id;
             
            Set<AcctSeed__Account_Payable_Line__c> apSet = new Set<AcctSeed__Account_Payable_Line__c>();
            apSet.addAll(apLinesToUpdate);
            List<AcctSeed__Account_Payable_Line__c> newApList = new List<AcctSeed__Account_Payable_Line__c>();
            for(AcctSeed__Account_Payable_Line__c a : apSet){
                newApList.add(a);
            }
            update newApList;
            System.debug('[MD] post update: ' + apLinesToUpdate[0].Billing_Line__c);
        }
    }
}