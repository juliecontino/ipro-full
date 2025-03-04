/*

10/28/2015 AM@IC created trigger utility class (00122547)
11/06/2015 AM@IC updated utility class with method to populate fields when trigger conditions are met[Update__c from false to true] (00123891)

*/

public class BillingLineSalesTaxTriggerUtil{

    public static Set<Id> billings;
    
    
    public static Boolean run{get;set;}
    public static Boolean bulkNote{get;set;}
    static{
        run = true;
        bulkNote = false;
    }
    
    public static void autoPopulateFields(Set<Id> lineIds){
            
            // instantiates list of Billing Lines to check
        List<AcctSeed__Billing_Line__c> billingLines = [SELECT AcctSeed__GL_Account_Variable_1__c, AcctSeed__GL_Account_Variable_2__c,
                                                        AcctSeed__Expense_GL_Account__c, AcctSeed__Revenue_GL_Account__c,
                                                        AcctSeed__Billing__r.AcctSeed__Customer__r.Branch__c, AcctSeed__Billing__r.AcctSeed__Customer__r.Account_Executive__c,
                                                        AcctSeed__Product__r.AcctSeed__Inventory_type__c, AcctSeed__Billing__r.Billing_Type__c
                                                        FROM AcctSeed__Billing_Line__c
                                                        WHERE Id IN :lineIds];
            
            // Queries for GL accounts to update billingLines with                                                
        List<AcctSeed__GL_Account__c> glAccounts = [SELECT Id, Gl_Number__c FROM AcctSeed__GL_Account__c WHERE GL_Number__c = '12420' OR GL_Number__c = '12890' ORDER BY GL_Number__c];
        
            // iterates through billing lines, updates fields accordingly
        for(AcctSeed__Billing_Line__c b : billingLines){
            b.AcctSeed__GL_Account_Variable_1__c = b.AcctSeed__Billing__r.AcctSeed__Customer__r.Branch__c;
            b.AcctSeed__GL_Account_Variable_2__c = b.AcctSeed__Billing__r.AcctSeed__Customer__r.Account_Executive__c;

            if(b.AcctSeed__Product__r.AcctSeed__Inventory_Type__c == 'Purchased' && b.AcctSeed__Billing__r.Billing_type__c == 'Managed Service Asset'){
                b.AcctSeed__Revenue_GL_Account__c = glAccounts[0].Id;
                b.AcctSeed__Expense_Gl_Account__c = glAccounts[1].Id;
            }
            b.Update__c = false;
        }
        update billingLines;
    }
    
    public static void performSalesTaxOp(Set<Id> billingIds){
        List<AcctSeed__Billing_Line__c> billingLines;
        List<AcctSeed__Billing_Line__c> matchedBillingLines = new List<AcctSeed__Billing_Line__c>();
        Map<Id, AcctSeed__Billing_Line__c> matchedBillingLinesMap = new Map<Id, AcctSeed__Billing_Line__c>();
        Map<Id, AS_Tax__Account_Tax__c> taxMap = new Map<Id, AS_Tax__Account_Tax__c>();
        Set<Id> custAccIds = new Set<Id>();
            
        billingLines = [SELECT Id, AcctSeed__Billing__c, AcctSeed__Total__c, AcctSeed__Billing__r.AcctSeed__Status__c, 
                        AcctSeed__Billing__r.AcctSeed__Customer__c, AcctSeed__Product__c, AcctSeed__Hours_Units__c, 
                        AcctSeed__Product__r.AcctSeed__Accounting_Type__c, AcctSeed__Product__r.AcctSeed__Tax_Rate__c,
                        AcctSeed__Product__r.Name
                        FROM AcctSeed__Billing_Line__c 
                        WHERE AcctSeed__Billing__c IN :billingIds AND AcctSeed__Product__c != null AND AcctSeed__Billing__r.AcctSeed__Status__c != 'Posted']; 

            // populates billing  map for requirement check 
        Map<Id, AcctSeed__Billing__c> billingMap = new Map<Id, AcctSeed__Billing__c>([SELECT Id, AcctSeed__Status__c, AcctSeed__Customer__c 
                                                                                      FROM AcctSeed__Billing__c 
                                                                                      WHERE Id IN :billingIds AND AcctSeed__Status__c != 'Posted']);
            
            // performs requirement checks, populates set of Customer Ids if requirements are met
        
        
        
        for(AcctSeed__Billing__c b : billingMap.values()){
            custAccIds.add(b.AcctSeed__Customer__c);
        }
            // populates map with Customer Ids and Custom tax objects
        for(AS_Tax__Account_Tax__c taxObj : [SELECT Id, AS_Tax__Rate__c, AS_Tax__Account__c, AS_Tax__Tax_Rate__c, AS_Tax__Tax_Rate__r.Name
                                            FROM AS_Tax__Account_Tax__c 
                                            WHERE (AS_Tax__Account__c IN :custAccIds)]){
            taxMap.put(taxObj.AS_Tax__Account__c, taxObj);
        }
            // checks if any of the billingLines Product field matched the parent billing's customer's tax rate(product)
        for(AcctSeed__Billing_Line__c bL : billingLines){
            if(bL.AcctSeed__Product__c == taxMap.get(bL.AcctSeed__Billing__r.AcctSeed__Customer__c).AS_Tax__Tax_Rate__c){
                matchedBillingLinesMap.put(bL.AcctSeed__Billing__c, bL);
            }           
        }   
            
            // if no billing lines meet the requirements, create one that does... If there is one (or more), update those with the correct values 

        for(Id billId : billingIds){
            AS_Tax__Account_Tax__c customerProduct = taxMap.get(billingMap.get(billId).AcctSeed__Customer__c);
            if(matchedBillingLinesMap.get(billId) == null){
                Decimal rate = getRateForBilling(billId, billingLines);
                Decimal billingLineRate = rate * (customerProduct.As_Tax__Rate__c/100);
                String custTaxRateProduct = customerProduct.As_Tax__Tax_Rate__c;
                AcctSeed__Billing_Line__c newBillingLine = new AcctSeed__Billing_Line__c(RB_Invoice_Line_Description__c = customerProduct.AS_Tax__Tax_Rate__r.Name , AcctSeed__Hours_Units__c = 1, AcctSeed__Product__c = custTaxRateProduct, AcctSeed__Billing__c = billId, AcctSeed__Rate__c = billingLineRate);
                matchedBillingLines.add(newBillingLine);
            }else{
                AcctSeed__Billing_Line__c billingLine = matchedBillingLinesMap.get(billId);
                Decimal rate = getRateForBilling(billId, billingLines);
                Decimal billingLineRate = rate * (billingLine.AcctSeed__Product__r.AcctSeed__Tax_Rate__c/100);
                billingLine.AcctSeed__Hours_Units__c = 1;
                billingLine.AcctSeed__Rate__c = billingLineRate;
                billingLine.RB_Invoice_Line_Description__c = customerProduct.AS_Tax__Tax_Rate__r.Name;
                matchedBillingLines.add(billingLine);
            }
        }          
        upsert matchedBillingLines;
    }

    public static void performSalesTaxOpBulk(Set<Id> billingIds){
        BillingLineSalesTaxTriggerUtil.run = false;
        BillingLineSalesTaxTriggerUtil.bulkNote = true;
        List<AcctSeed__Billing_Line__c> billingLines;
        Map<Id, AcctSeed__Billing_Line__c[]> billingLineMap = new Map<Id, AcctSeed__Billing_Line__c[]>();

        List<AcctSeed__Billing_Line__c> matchedBillingLines = new List<AcctSeed__Billing_Line__c>();
        Map<Id, AcctSeed__Billing_Line__c> matchedBillingLinesMap = new Map<Id, AcctSeed__Billing_Line__c>();
        Map<Id, AS_Tax__Account_Tax__c> taxMap = new Map<Id, AS_Tax__Account_Tax__c>();
        Set<Id> custAccIds = new Set<Id>();
            
        billingLines = [SELECT Id, AcctSeed__Billing__c, AcctSeed__Total__c, AcctSeed__Billing__r.AcctSeed__Status__c, 
                        AcctSeed__Billing__r.AcctSeed__Customer__c, AcctSeed__Product__c, AcctSeed__Hours_Units__c, 
                        AcctSeed__Product__r.AcctSeed__Accounting_Type__c, AcctSeed__Product__r.AcctSeed__Tax_Rate__c,
                        AcctSeed__Product__r.Name
                        FROM AcctSeed__Billing_Line__c 
                        WHERE AcctSeed__Billing__c IN :billingIds AND AcctSeed__Product__c != null AND AcctSeed__Billing__r.AcctSeed__Status__c != 'Posted']; 

            // populates billing  map for requirement check 
        Map<Id, AcctSeed__Billing__c> billingMap = new Map<Id, AcctSeed__Billing__c>([SELECT Id, AcctSeed__Status__c, AcctSeed__Customer__c 
                                                                                      FROM AcctSeed__Billing__c 
                                                                                      WHERE Id IN :billingIds AND AcctSeed__Status__c != 'Posted']);
            
            // performs requirement checks, populates set of Customer Ids if requirements are met
        
        
        
        for(AcctSeed__Billing__c b : billingMap.values()){
            custAccIds.add(b.AcctSeed__Customer__c);
        }
            // populates map with Customer Ids and Custom tax objects
        for(AS_Tax__Account_Tax__c taxObj : [SELECT Id, AS_Tax__Rate__c, AS_Tax__Account__c, AS_Tax__Tax_Rate__c, AS_Tax__Tax_Rate__r.Name
                                            FROM AS_Tax__Account_Tax__c 
                                            WHERE (AS_Tax__Account__c IN :custAccIds)]){
            taxMap.put(taxObj.AS_Tax__Account__c, taxObj);
        }
            // checks if any of the billingLines Product field matched the parent billing's customer's tax rate(product)
        for(AcctSeed__Billing_Line__c bL : billingLines){
            
            if(billingLineMap.get(bL.AcctSeed__Billing__c) == null){
                billingLineMap.put(bL.AcctSeed__Billing__c, new AcctSeed__Billing_Line__c[]{});
                billingLineMap.get(bL.AcctSeed__Billing__c).add(bL);
            }else{
                billingLineMap.get(bL.AcctSeed__Billing__c).add(bL);
            }

            if(taxMap.get(bL.AcctSeed__Billing__r.AcctSeed__Customer__c) == null){
                continue;
            }else if(bL.AcctSeed__Product__c == taxMap.get(bL.AcctSeed__Billing__r.AcctSeed__Customer__c).AS_Tax__Tax_Rate__c){
                matchedBillingLinesMap.put(bL.AcctSeed__Billing__c, bL);
            }           
        }   
            
            // if no billing lines meet the requirements, create one that does... If there is one (or more), update those with the correct values 
        
        for(Id billId : billingIds){
            if(taxMap.get(billingMap.get(billId).AcctSeed__Customer__c) == null){
                continue;
            }

            AS_Tax__Account_Tax__c customerProduct = taxMap.get(billingMap.get(billId).AcctSeed__Customer__c);
            if(matchedBillingLinesMap.get(billId) == null){
                Decimal totalRate = getRateForBillingBulk(billId, billingLineMap);
                Decimal billingLineRate = totalRate * (customerProduct.As_Tax__Rate__c/100);
                String custTaxRateProduct = customerProduct.As_Tax__Tax_Rate__c;
                AcctSeed__Billing_Line__c newBillingLine = new AcctSeed__Billing_Line__c(RB_Invoice_Line_Description__c = customerProduct.AS_Tax__Tax_Rate__r.Name , AcctSeed__Hours_Units__c = 1, AcctSeed__Product__c = custTaxRateProduct, AcctSeed__Billing__c = billId, AcctSeed__Rate__c = billingLineRate);
                matchedBillingLines.add(newBillingLine);
            }else{
                AcctSeed__Billing_Line__c billingLine = matchedBillingLinesMap.get(billId);
                Decimal totalRate = getRateForBillingBulk(billId, billingLineMap);
                Decimal billingLineRate = totalRate * (billingLine.AcctSeed__Product__r.AcctSeed__Tax_Rate__c/100);
                billingLine.AcctSeed__Hours_Units__c = 1;
                billingLine.AcctSeed__Rate__c = billingLineRate;
                billingLine.RB_Invoice_Line_Description__c = customerProduct.AS_Tax__Tax_Rate__r.Name;
                matchedBillingLines.add(billingLine);
            }
        }          
        upsert matchedBillingLines;
    }
    
    public static Decimal getRateForBilling(Id billId, List<AcctSeed__Billing_Line__c> billingLines){
        Decimal rate = 0;
                for(AcctSeed__Billing_Line__c b : billingLines){
                    if(b.AcctSeed__Billing__c == billId && b.AcctSeed__Product__r.AcctSeed__Accounting_Type__c == 'Taxable Product'){
                        rate += b.AcctSeed__Total__c;
                    }
                }
        return rate;
    }

    public static Decimal getRateForBillingBulk(Id billId, Map<Id, AcctSeed__Billing_Line__c[]> billLineMap){
        Decimal rate = 0;
            if(billLineMap.get(billId) != null){
                for(AcctSeed__Billing_Line__c b : billLineMap.get(billId)){
                    if(b.AcctSeed__Product__r.AcctSeed__Accounting_Type__c == 'Taxable Product'){
                        rate += b.AcctSeed__Total__c;
                    }
                }
            }    
        return rate;
    }
}