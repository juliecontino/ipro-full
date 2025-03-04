/*
	Purpose: Allow user to bulk upload assets to an account

	06/16/2016  MD@IC  Created (00132537)
	06/24/2016  MD@IC  Throw error if product code is not found (00132537)
*/
public class UploadAssetsCtrl{

	public Map<String, String> params{get;set;}
	public Boolean debug{get;set;}
    public Account account{get;set;}

    public String error{get;set;}

    public transient Blob file{get;set;}
    public String fileName{get;set;}

	public UploadAssetsCtrl(){
		params = ApexPages.currentPage().getParameters();
		debug = params.get('debug') == '1';
		String accountId = params.get('aid');
		if(String.isNotBlank(accountId)){
			account = [SELECT Id, Name FROM Account WHERE Id = :accountId];
		}
		if(account == null){
			ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'There is no account specified.'));
			error = 'account';
		}
	}

	public PageReference cancel(){
		return new PageReference('/' + account.Id);
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
		try{
	        HttpRequest httpReq = new HttpRequest();
	        httpReq.setBodyAsBlob(file);
	        List<List<String>> allFields = CsvUtil.parseCSV(httpReq.getBody(), false);

	        if(allFields.size() < 3){
	        	ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'The file is not correct, there are not enough rows.'));
	        	return;
	        }

	        List<String> application = allFields.remove(0);  // Application Record(s)
	        // blank rows are removed in parseCSV()
	        //allFields.remove(0);  // blank

	        List<String> fieldNames = allFields.remove(0);
	        Map<String, Integer> columnMap = CsvUtil.mapColumns(fieldNames);
	        if(debug) ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.INFO, 'columnMap = ' + columnMap));

	        // check for required columns
	        List<String> columns = new List<String>{'Order Date','Purchase Order','Sales Ref','Product','Description','State','Quantity'};
	        if(CsvUtil.checkForColumns(columnMap, columns)) return;

	        String applicationRecordIds = application[0].substringAfter('Mitel Application Record(s):').trim();

	        List<AssetWrapper> assets = new List<AssetWrapper>();
	        Set<String> productCodes = new Set<String>();
	        i = 0;
	        for(List<String> row : allFields){
	        	i++;
	        	String productCode = row[columnMap.get('Product')];
	        	//String purchaseOrder = 'PO-' + row[columnMap.get('Purchase Order')].substringBefore(' ').trim();
	        	// support both date formats
	        	Date orderDate;
	        	try{
	        		orderDate = Date.valueOf(row[columnMap.get('Order Date')]);
	        	}
	        	catch(Exception e){
	        		orderDate = Date.parse(row[columnMap.get('Order Date')]);
	        	}
	        	Asset a = new Asset(
	        		AccountId = account.Id,
	        		//Name = purchaseOrder + ' - ' + String.valueOf(orderDate),
	        		Application_Record_ID__c = applicationRecordIds,
	        		PurchaseDate = orderDate,
	        		Purchase_Order__c = row[columnMap.get('Purchase Order')].trim(),
	        		Sales_Reference__c = row[columnMap.get('Sales Ref')].trim(),
	        		Description = row[columnMap.get('Description')].trim(),
                    Status = 'Purchased',
	        		State__c = row[columnMap.get('State')].trim(),
	        		Quantity = Integer.valueOf(row[columnMap.get('Quantity')].trim())
	        	);
	        	productCodes.add(productCode);
	        	assets.add(new AssetWrapper(a, productCode));
	        }
	        i = null;

	        // populate lookup fields
	        System.debug('Product Codes: ' + productCodes);
	        Map<String, Product2> products = new Map<String, Product2>();
	        for(Product2 p : [SELECT Id, Name, External_Product_Code__c FROM Product2 WHERE External_Product_Code__c IN :productCodes LIMIT 20000]){
	        	System.debug('Product: ' + p);
	        	products.put(p.External_Product_Code__c, p);
	        }

	        List<Asset> assetsToInsert = new List<Asset>();
	        Boolean productError = false;
	        i = 0;
	        for(AssetWrapper aw : assets){
	        	i++;
                aw.asset.Name = '';
	        	if(products.containsKey(aw.productCode)){
                    aw.asset.Name += products.get(aw.productCode).Name;
                    aw.asset.Product2Id = products.get(aw.productCode).Id;
	                aw.asset.Name += (aw.asset.PurchaseDate != null ? ' - ' + (Datetime.newInstance(aw.asset.PurchaseDate.year(), aw.asset.PurchaseDate.month(), aw.asset.PurchaseDate.day())).format('MM-dd-yyyy') : '');
		        	assetsToInsert.add(aw.asset);
                }
                else{
                	productError = true;
                	CsvUtil.throwError('Missing External Product Code (Asset #' + i + ')');
                }
	        }
	        i = null;

	        if(productError){
	        	return;
	        }

	        if(!assetsToInsert.isEmpty()){
	        	List<Database.SaveResult> results = Database.insert(assetsToInsert, false);
	        	Boolean error = false;
	        	for(Database.SaveResult r : results){
	        		if(!r.isSuccess()){
	        			error = true;
	        			for(Database.Error e : r.getErrors())
	        				ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, e.getMessage()));
	        		}
	        	}
	        	if(error) return;
	        }
		}
		catch(Exception e){
			String str = '';
			if(i != null) str += 'Error occurred on Asset #' + i + ':<br/>';
			str += e.getMessage().contains('FIELD_CUSTOM_VALIDATION_EXCEPTION') ? e.getMessage().substringAfter('FIELD_CUSTOM_VALIDATION_EXCEPTION, ').substringBefore(': []') : e.getMessage();
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, str));
			return;
		}
        ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.CONFIRM, 'Upload successful'));
	}

    // ============================== Wrapper Classes ==============================
    public class AssetWrapper{
    	public Asset asset{get;set;}
    	public String productCode{get;set;}
    	public AssetWrapper(Asset asset, String productCode){
    		this.asset = asset;
    		this.productCode = productCode;
    	}
    }

}