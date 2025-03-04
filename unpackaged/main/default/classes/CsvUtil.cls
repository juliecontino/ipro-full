/*
	Purpose: Handle parsing CSV files

	Unit Tests: UploadAssetsTest, UploadSalesOrderLinesTest

	06/20/2016  MD@IC  Created (00132537/00132538)
*/
public class CsvUtil{
    public static List<List<String>> parseCSV(String contents,Boolean skipHeaders){
        List<List<String>> allFields = new List<List<String>>();

        // replace instances where a double quote begins a field containing a comma
        // in this case you get a double quote followed by a doubled double quote
        // do this for beginning and end of a field
        contents = contents.replaceAll(',"""',',"DBLQT').replaceall('""",','DBLQT",');
        // now replace all remaining double quotes - we do this so that we can reconstruct
        // fields with commas inside assuming they begin and end with a double quote
        contents = contents.replaceAll('""','DBLQT');
        // we are not attempting to handle fields with a newline inside of them
        // so, split on newline to get the spreadsheet rows
        List<String> lines = new List<String>();
        try{
            if(contents.contains('\r\n')) lines = contents.split('\r\n');
            else if(contents.contains('\r')) lines = contents.split('\r');
            else lines = contents.split('\n');
        }
        catch (System.ListException e){
            System.debug('Limits exceeded? ' + e.getMessage());
            //ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'Error parsing CSV: ' + e.getMessage()));
        }

        Integer num = 0;
        for(String line : lines){
            // check for blank CSV lines (only commas)
            //if(line.replaceAll(',','').trim().length() == 0) break;
            // there are intended blank lines
            if(line.replaceAll(',','').trim().length() == 0) continue;

            List<String> fields = line.split(',');
            List<String> cleanFields = new List<String>();
            String compositeField;
            Boolean makeCompositeField = false;
            for(String field : fields){
                if(field.startsWith('"') && field.endsWith('"') && field.contains('DBLQT')){
                    cleanFields.add(field.replaceAll('DBLQT','"'));
                }
                else if(field.startsWith('"') && field.endsWith('"')){
                	cleanFields.add(field.replaceAll('"',''));
                }
                else if(field.startsWith('"')){
                    makeCompositeField = true;
                    compositeField = field;
                }
                else if(field.endsWith('"')){
                    compositeField += ',' + field;
                    cleanFields.add(compositeField.replaceAll('DBLQT','"'));
                    makeCompositeField = false;
                }
                else if(makeCompositeField){
                    compositeField +=  ',' + field;
                }
                else{
                    cleanFields.add(field.replaceAll('DBLQT','"'));
                }
            }
            allFields.add(cleanFields);
        }
        if(skipHeaders) allFields.remove(0);
        return allFields;
    }

    // Maps header values to the column number they are in
    public static Map<String, Integer> mapColumns(List<String> fields){
        Map<String, Integer> columnMap = new Map<String,Integer>();
        for(Integer i = 0; i < fields.size(); i++){
            // handel the leading no width nonbreaking space if there is one
            if(fields[i].charAt(0) == 65279) fields[i] = fields[i].substring(1, fields[i].length());
            columnMap.put(fields[i],i);
        }
        return columnMap;
    }

    public static Boolean checkForColumns(Map<String, Integer> columnMap, List<String> columns){
    	Boolean error = false;
    	for(String c : columns){
    		c = c.trim();
    		if(columnMap.get(c) == null){
    			missingColumnError(c);
    			error = true;
    		}
    	}
    	return error;
    }

    public static void missingColumnError(String fieldName){
        throwError('The ' + fieldName + ' column is missing.');
    }
    public static void missingDataError(String fieldName, Integer row){
    	throwError(fieldName + ' is a required field (Record #: ' + row + ')');
    }
    public static void throwError(String err){
    	ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, err));
    }
}