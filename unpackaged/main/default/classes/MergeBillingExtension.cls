/*
Controller for Opportunity Billing merge page

02/14/15 BS@IC Created(00127964)
11/11/16 KW@IC added opportunityid to recurring billing line creation (line 93)
*/

public class MergeBillingExtension {
    private Opportunity opp;
    public OliWrapper[] olis {get; set;}
    public RecurringBillingWrapper[] recurringBillings {get; set;}

    public MergeBillingExtension(ApexPages.StandardController ctrl) {
        //Get Opportunity details
        if(!Test.isRunningTest())
            ctrl.addFields(new String[]{'AccountId', 'Contract_Number__c', 'Account.Branch__c', 'Account.Account_Executive__c'});
        opp = (Opportunity)ctrl.getRecord();

        //Get Opportunity line items
        olis = new OliWrapper[]{};
        Set<String> oliFields = new Set<String> {'Quantity', 'UnitPrice', 'Discount', 'Product2Id', 'Product2.AcctSeed__Revenue_GL_Account__c', 'AcctSeed__Project__c', 'AcctSeed__Project_Task__c', 'GA_Billing_Group__c', 'Description'};
        for(FieldSetMember member : SObjectType.OpportunityLineItem.fieldsets.Merge_Billing_Fields.getFields())
            oliFields.add(member.getFieldPath());
        for(OpportunityLineItem oli : Database.query(
            'SELECT ' + String.join(new List<String>(oliFields), ', ') + ' ' +
            'FROM OpportunityLineItem ' +
            'WHERE OpportunityId = \'' + opp.Id + '\' ' +
            'LIMIT 1000'
        )) {
            olis.add(new OliWrapper(oli));
        }

        //Get Recurring Billing fields to be queried
        Set<String> recurringBillingFields = new Set<String>{'Id'}; //Query requires at least 1 field
        for(FieldSetMember fsm : SObjectType.AcctSeed__Recurring_Billing__c.fieldsets.Merge_Billing_Fields.getFields())
            recurringBillingFields.add(fsm.getFieldPath());

        //Query Recurring Billings
        Set<Id> billingIds = new Set<Id>();
        recurringBillings = new RecurringBillingWrapper[]{};
        for(AcctSeed__Recurring_Billing__c billing : Database.query('SELECT ' + String.join(new List<String>(recurringBillingFields), ', ') + ' FROM AcctSeed__Recurring_Billing__c WHERE AcctSeed__Status__c = \'Active\' AND AcctSeed__Customer__c = \'' + opp.AccountId + '\' LIMIT 1000')) {
            billingIds.add(billing.Id);
            recurringBillings.add(new RecurringBillingWrapper(billing));
        }

        //Ger Recurring Billing Line fields to be queried
        Set<String> recurringBillingLineFields = new Set<String>{'AcctSeed__Recurring_Billing__c'};
        for(FieldSetMember fsm : SObjectType.AcctSeed__Recurring_Billing_Line__c.fieldsets.Merge_Billing_Fields.getFields())
            recurringBillingLineFields.add(fsm.getFieldPath());

        //Query Recurring Billing Lines
        Map<Id, AcctSeed__Recurring_Billing_Line__c[]> linesByBillingId = new Map<Id, AcctSeed__Recurring_Billing_Line__c[]>();
        for(AcctSeed__Recurring_Billing_Line__c line : Database.query('SELECT ' + String.join(new List<String>(recurringBillingLineFields), ', ') + ' FROM AcctSeed__Recurring_Billing_Line__c WHERE AcctSeed__Recurring_Billing__c IN :billingIds LIMIT 10000')) {
            if(!linesByBillingId.containsKey(line.AcctSeed__Recurring_Billing__c))
                linesByBillingId.put(line.AcctSeed__Recurring_Billing__c, new AcctSeed__Recurring_Billing_Line__c[]{});

            linesByBillingId.get(line.AcctSeed__Recurring_Billing__c).add(line);
        }

        //Populate lines associated with each recurring billing
        for(RecurringBillingWrapper wrapper : recurringBillings)
            if(linesByBillingId.containsKey(wrapper.billing.Id))
                wrapper.lines = linesByBillingId.get(wrapper.billing.Id);
    }

    public PageReference mergeOppWithSelectedRecurringBilling() {
        //Get selected recurring billing
        RecurringBillingWrapper selected = null;
        for(RecurringBillingWrapper wrapper : recurringBillings)
            if(wrapper.selected == true) {
                selected = wrapper;
                break;
            }

        //Error if nothing is selected
        if(selected == null) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'You must select a Recurring Billing'));
            return null;
        }

        Boolean lineSelected = false;
        AcctSeed__Recurring_Billing_Line__c[] toInsert = new AcctSeed__Recurring_Billing_Line__c[]{};
        for(OliWrapper line : olis) {
            if(line.selected == true) {
                lineSelected = true;
                
                toInsert.add(new AcctSeed__Recurring_Billing_Line__c(
                    AcctSeed__Recurring_Billing__c = selected.billing.Id,
                    AcctSeed__Quantity__c = line.oli.Quantity,
                    AcctSeed__Rate__c = line.oli.UnitPrice * (line.oli.Discount != null ? (100 - line.oli.Discount) / 100 : 1),
                    AcctSeed__Product__c = line.oli.Product2Id,
                    AcctSeed__Revenue_GL_Account__c = line.oli.Product2.AcctSeed__Revenue_GL_Account__c,
                    Opportunity__c=opp.id,
                    AcctSeed__Project__c = line.oli.AcctSeed__Project__c,
                    AcctSeed__Project_Task__c = line.oli.AcctSeed__Project_Task__c,
                    Opportunity_Contract_Number__c = opp.Contract_Number__c,
                    Billing_Category__c = line.oli.GA_Billing_Group__c,
                    RB_Invoice_Line_Description__c = line.oli.Description,
                    Taxable__c = true,
                    AcctSeed__GL_Account_Variable_1__c = opp.AccountId != null ? opp.Account.Branch__c : null,
                    AcctSeed__GL_Account_Variable_2__c = opp.AccountId != null ? opp.Account.Account_Executive__c : null
                ));
            }
        }

        //Error if no Opportunity Line Item is selected
        if(lineSelected == false) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'You must select an Opportunity Product'));
            return null;
        }

        SavePoint sp = Database.setSavePoint();
        try {
            insert toInsert;
            return new PageReference('/' + opp.Id);
        }
        catch(DmlException e) {
            for(Integer i = 0, l = e.getNumDml(); i < l; i++)
                ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, e.getDmlMessage(i)));
            Database.rollback(sp);
            return null;
        }
    }

    public class OliWrapper {
        public Boolean selected {get; set;}
        public OpportunityLineItem oli {get; set;}
        
        public OliWrapper(OpportunityLineItem line) {
            selected = true;
            oli = line;
        }
    }

    public class RecurringBillingWrapper {
        public Boolean selected {get; set;}
        public AcctSeed__Recurring_Billing__c billing {get; set;}
        public AcctSeed__Recurring_Billing_Line__c[] lines {get; set;}

        public RecurringBillingWrapper(AcctSeed__Recurring_Billing__c rb) {
            selected = false;
            billing = rb;
            lines = new AcctSeed__Recurring_Billing_Line__c[]{};
        }
    }
}