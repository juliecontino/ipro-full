trigger SpringCMAccount on Account (after insert, after update) {

    Map<ID, Schema.RecordTypeInfo> rtMap = Schema.SObjectType.Account.getRecordTypeInfosById();
    Map<String, String> acc = new Map<String, String>();

    for(Account a : Trigger.new) {
        String recordType = null;
        if(rtMap != null && rtMap.size() > 1) {
            ID rtId = (ID)a.get('RecordTypeId');
            if (rtId != null) recordType = rtMap.get(rtId).getName();
            }
        acc.put(a.Id, recordType);
        }
    SpringCMRestWrap.BuildEOS(acc, 'Account', UserInfo.getSessionId(), 'Workflow Name');

    }