/*
	Purpose: Allow user to upload Sales Order Lines to the Sales Order via CSV

	06/20/2016  MD@IC  Created (00132538)
*/
public class UploadSalesOrderLinesCtrl{

	public Map<String, String> params{get;set;}
	public Boolean debug{get;set;}
    public AcctSeedERP__Sales_Order__c salesOrder{get;set;}

    public String error{get;set;}

    public transient Blob file{get;set;}
    public String fileName{get;set;}

	public UploadSalesOrderLinesCtrl(){
		params = ApexPages.currentPage().getParameters();
		debug = params.get('debug') == '1';
		String salesOrderId = params.get('soid');
		if(String.isNotBlank(salesOrderId)){
			salesOrder = [SELECT Id, Name FROM AcctSeedERP__Sales_Order__c WHERE Id = :salesOrderId];
		}
		if(salesOrder == null){
			ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'There is no Sales Order specified.'));
			error = 'salesOrder';
		}
	}

	public PageReference cancel(){
		return new PageReference('/' + salesOrder.Id);
	}

	public void upload(){
        if(file == null){
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'You must select a file before uploading.'));
            return;
        }
        if(String.isNotBlank(fileName) && !fileName.contains('.csv')){
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Only CSV files are supported.'));
            return;
        }

		Integer i = null;
		Boolean error = false;
		try{
	        HttpRequest httpReq = new HttpRequest();
	        httpReq.setBodyAsBlob(file);
	        List<List<String>> allFields = CsvUtil.parseCSV(httpReq.getBody(), false);

	        if(allFields.size() < 2){
	        	ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'The file is not correct, there are not enough rows.'));
	        	return;
	        }

	        List<String> fieldNames = allFields.remove(0);
	        Map<String, Integer> columnMap = CsvUtil.mapColumns(fieldNames);
	        if(debug) ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.INFO, 'columnMap = ' + columnMap));

	        // check for required columns
	        List<String> columnNames = new List<String>{'External Product Code', 'Order Quantity', 'Unit Price', 'AMC Transaction ID'};
	        if(CsvUtil.checkForColumns(columnMap, columnNames)) return;

	        List<SolWrapper> salesOrderLines = new List<SolWrapper>();
	        Set<String> productCodes = new Set<String>();
	        i = 0;
	        for(List<String> row : allFields){
	        	i++;
	        	if(debug) System.debug('row: ' + row);
	        	String productCode = row[columnMap.get('External Product Code')];
	        	if(String.isBlank(productCode)){
	        		CsvUtil.missingDataError('External Product Code', i);
	        		error = true;
	        	}
	        	AcctSeedERP__Sales_Order_Line__c sol = new AcctSeedERP__Sales_Order_Line__c(
	        		AcctSeedERP__Sales_Order__c = salesOrder.Id,
	        		AcctSeedERP__Unit_Price__c = Decimal.valueOf(row[columnMap.get('Unit Price')].trim()),
	        		AcctSeedERP__Quantity_Ordered__c = Integer.valueOf(row[columnMap.get('Order Quantity')].trim()),
	        		AMC_Transaction_ID__c = columnMap.get('AMC Transaction ID') < row.size() ? row[columnMap.get('AMC Transaction ID')].trim() : ''
	        	);
	        	productCodes.add(productCode);
	        	salesOrderLines.add(new SolWrapper(sol, productCode));
	        }
	        i = null;
	        if(error) return;

	        // populate lookup fields
	        if(debug) System.debug('Product Codes: ' + productCodes);
	        Map<String, Product2> products = new Map<String, Product2>();
	        // order by CreatedDate to handle duplicate external product codes, newer first, this way the oldest one will be the one in the product map
	        for(Product2 p : [SELECT Id, Name, External_Product_Code__c FROM Product2 WHERE External_Product_Code__c IN :productCodes ORDER BY CreatedDate DESC LIMIT 20000]){
	        	if(debug) System.debug('Product: ' + p);
	        	products.put(p.External_Product_Code__c, p);
	        }
	        if(debug) System.debug('Products found: ' + products.size());

	        List<AcctSeedERP__Sales_Order_Line__c> solToInsert = new List<AcctSeedERP__Sales_Order_Line__c>();
	        i = 0;
	        for(SolWrapper sol : salesOrderLines){
	        	i++;
	        	if(products.containsKey(sol.productCode))
	        		sol.salesOrderLine.AcctSeedERP__Product__c = products.get(sol.productCode).Id;
	        	else{
	        		CsvUtil.throwError('Could not find product for External Product Code on Row # ' + i);
	        		error = true;
	        	}
	        	solToInsert.add(sol.salesOrderLine);
	        }
	        i = null;
	        if(error) return;

	        if(debug) System.debug('solToInsert: [' + solToInsert.size() + '] ' + solToInsert);

	        if(!solToInsert.isEmpty()){
	        	List<Database.SaveResult> results = Database.insert(solToInsert, false);
	        	error = false;
	        	for(Database.SaveResult r : results){
	        		if(!r.isSuccess()){
	        			error = true;
	        			for(Database.Error e : r.getErrors())
	        				ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, e.getMessage() + ' ' + e.getFields()));
	        		}
	        	}
	        	if(error) return;
	        }
		}
		catch(Exception e){
			String str = '';
			if(i != null) str += 'Error occurred on line #' + i + ':<br/>';
			str += e.getMessage().contains('FIELD_CUSTOM_VALIDATION_EXCEPTION') ? e.getMessage().substringAfter('FIELD_CUSTOM_VALIDATION_EXCEPTION, ').substringBefore(': []') : e.getMessage();
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, str));
			return;
		}
        ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.CONFIRM, 'Upload successful'));
	}

    // ============================== Wrapper Classes ==============================
    public class SolWrapper{
    	public AcctSeedERP__Sales_Order_Line__c salesOrderLine{get;set;}
    	public String productCode{get;set;}
    	public SolWrapper(AcctSeedERP__Sales_Order_Line__c salesOrderLine, String productCode){
    		this.salesOrderLine = salesOrderLine;
    		this.productCode = productCode;
    	}
    }

}