/*
    10/05/15    SB @ IC    00119955
*/
global class CreateCreditMemosController {
    
    public Id billingId;
    public list<BillingLine> billingLines { get; set; }
    public String sortField { get; set; }
    public static String sField;
    public Boolean sortAsc { get; set; }
    public static Boolean sAsc;
    
    public CreateCreditMemosController(ApexPages.StandardController control) {
        billingId = control.getId();
        sortField = 'Name';
        sortAsc = true;
        retrieveBillingLines();
    }
    
    public void retrieveBillingLines() {
        billingLines = new list<BillingLine>{};
        Decimal totalBillAmount = 0;
        
        for (AcctSeed__Billing_Line__c line : getBillingLines()) {
            billingLines.add(new BillingLine(line));
            if (line.AcctSeed__Total__c != null) totalBillAmount += line.AcctSeed__Total__c;
        }
        
        billingLines.add(new BillingLine(totalBillAmount));
        sortLines();
    }
    
    public AcctSeed__Billing__c getBilling() {
        list<String> fields = new list<String>{};
        for (Schema.SObjectField sobjField : Schema.SObjectType.AcctSeed__Billing__c.fields.getMap().values()) {
            fields.add(sobjField.getDescribe().getName());
        }
        String q = 'SELECT ' + String.join(fields,',') + ' FROM AcctSeed__Billing__c WHERE Id = \''+billingId+'\'';
        return Database.query(q);
    }
    
    public list<AcctSeed__Billing_Line__c> getBillingLines() {
        list<String> fields = new list<String>{};
        for (Schema.SObjectField sobjField : Schema.SObjectType.AcctSeed__Billing_Line__c.fields.getMap().values()) {
            fields.add(sobjField.getDescribe().getName());
        }
        String q = 'SELECT ' + String.join(fields,',') + ',AcctSeed__Product__r.Name FROM AcctSeed__Billing_Line__c WHERE AcctSeed__Billing__c = \''+billingId+'\'';
        return Database.query(q);
    }
    
    public void sortLines() {
        sField = sortField;
        sAsc = sortAsc;
        billingLines.sort();
    }
    
    public void updateSort() {
        String newField = ApexPages.currentPage().getParameters().get('field');
        if (newField == sortField)
            sortAsc = !sortAsc;
        else {
            sortField = newField;
            sortAsc = true;
        }
        sortLines();
    }
    
    public PageReference saveCreditMemos() {
        System.Savepoint save = Database.setSavepoint();
        try {
            Boolean error = false;
            for (BillingLine bl : billingLines) {
                if (bl.selected) {
                    Decimal credit = bl.overrideAmount ? bl.creditAmount : bl.creditQuantity * bl.line.AcctSeed__Rate__c;
                    bl.error = credit > bl.billAmount;
                    error = error || bl.error;
                }
            }
            if (error) return null;
            
            AcctSeed__Billing__c billing = getBilling();
            AcctSeed__Billing__c memo = billing.clone(false,true);
            memo.OwnerId = UserInfo.getUserId();
            //memo.Billing_to_Apply_Credit_Memo__c = billing.Id;
            memo.AcctSeed__Date__c = Date.today();
            memo.AcctSeed__Accounting_Period__c = null;
            memo.AcctSeed__Due_Date2__c = null;
            memo.Apply_Credit_Memo_to_Billing__c = billing.Id;
            insert memo;
            
            list<AcctSeed__Billing_Line__c> memoLines = new list<AcctSeed__Billing_Line__c>{};
            for (BillingLine bl : billingLines) {
                if (!bl.selected) continue;
                
                AcctSeed__Billing_Line__c memoLine = bl.line.clone(false,true);
                memoLine.AcctSeed__Billing__c = memo.Id;
                memoLine.AcctSeed__Hours_Units__c = -1 * bl.creditQuantity;
                memoLine.AcctSeed__Rate__c = bl.overrideAmount ? bl.creditAmount : bl.line.AcctSeed__Rate__c;
                if (String.isNotBlank(bl.description)) memoLine.AcctSeed__Comment__c = bl.description;
                memoLines.add(memoLine);
            }
            insert memoLines;
            
            return new PageReference('/'+memo.Id);
        } catch (Exception e) {
            Database.rollback(save);
            ApexPages.addMessages(e);
            return null;
        }
    }
    
    global class BillingLine implements Comparable {
        public AcctSeed__Billing_Line__c line { get; set; }
        public Boolean selected { get; set; }
        public Decimal billAmount { get; set; }
        public Boolean overrideAmount { get; set; }
        public Decimal creditQuantity { get; set; }
        public Decimal creditAmount { get; set; }
        public String description { get; set; }
        public Boolean error { get; set; }
        
        public BillingLine(AcctSeed__Billing_Line__c bl) {
            line = bl;
            billAmount = line.AcctSeed__Total__c;
            selected = false;
            overrideAmount = false;
            error = false;
        }
        
        public BillingLine(Decimal total) {
            billAmount = total;
            selected = false;
        }
        
        global Integer compareTo(Object compTo) {
            AcctSeed__Billing_Line__c thatLine = ((BillingLine)compTo).line;
            
            if (line == null) return 1;
            else if (thatLine == null) return -1;
            
            if (sField == 'Name') {
                if (line.Name > thatLine.Name) return sAsc ? 1 : -1;
                else if (line.Name < thatLine.Name) return sAsc ? -1 : 1;
            } else if (sField == 'AcctSeed__Hours_Units__c') {
                if (line.AcctSeed__Hours_Units__c > thatLine.AcctSeed__Hours_Units__c) return sAsc ? 1 : -1;
                else if (line.AcctSeed__Hours_Units__c < thatLine.AcctSeed__Hours_Units__c) return sAsc ? -1 : 1;
            } else if (sField == 'AcctSeed__Rate__c') {
                if (line.AcctSeed__Rate__c > thatLine.AcctSeed__Rate__c) return sAsc ? 1 : -1;
                else if (line.AcctSeed__Rate__c < thatLine.AcctSeed__Rate__c) return sAsc ? -1 : 1;
            } else if (sField == 'AcctSeed__Total__c') {
                if (line.AcctSeed__Total__c > thatLine.AcctSeed__Total__c) return sAsc ? 1 : -1;
                else if (line.AcctSeed__Total__c < thatLine.AcctSeed__Total__c) return sAsc ? -1 : 1;
            }
            return 0;
        }
    }
}