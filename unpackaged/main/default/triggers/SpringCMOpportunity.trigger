trigger SpringCMOpportunity on Opportunity (after insert, after update) {
    Map<ID, Schema.RecordTypeInfo> rtMap = Schema.SObjectType.Opportunity.getRecordTypeInfosById();
    Map<String, String> opp = new Map<String, String>();

    for(Opportunity o : Trigger.new) {
        String recordType = null;
        if(rtMap.size() > 1)
            recordType = rtMap.get((ID)o.get('RecordTypeId')).getName();
        opp.put(o.Id, recordType);
        }
    SpringCMRestWrap.BuildEOS(opp, 'Opportunity', UserInfo.getSessionId(), 'Workflow Name');
    }