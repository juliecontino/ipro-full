global class SpringCMRestWrap {
    @future(callout=true)
    public static void BuildEOS(String sfId, String sfType, String sId, String sfRecordType, String workflow) {
        if (workflow == null || workflow == '') return;
        if (sfType == null || sfType == '') return;
        if (sfId == null || sfId == '') return;
        string xml = '';
        xml = buildWorkflowXML(sfId, sfType, sId, sfRecordType);
        if(workflow != '') {
            SpringCM201411 service = new SpringCM201411();
            service.StartWorkflow(workflow, xml, sId);
            }
        }

    @future(callout=true)
    webservice static void StartWorkflow(String sfId, String sfType, String sId, String sfRecordType, String workflow) {
        if (workflow == null || workflow == '') return;
        if (sfType == null || sfType == '') return;
        if (sfId == null || sfId == '') return;
        string xml = '';
        xml = buildWorkflowXML(sfId, sfType, sId, sfRecordType);
        if(workflow != '') {
            SpringCM201411 service = new SpringCM201411();
            service.StartWorkflow(workflow, xml, sId);
            }
        }

    @future(callout=true)
    public static void BuildEOS(Map<String, String> objs, String sfType, String sId, String workflow) {
        if (workflow == null || workflow == '') return;
        if (sfType == null || sfType == '') return;
        string xml = '';
        xml = buildWorkflowXML(objs, sfType, sId);
        if(workflow != '') {
            SpringCM201411 service = new SpringCM201411();
            service.StartWorkflow(workflow, xml, sId);
            }
        }

    @future(callout=true)
    public static void UploadDocument(String id, String type, String name, Blob document, String sId) {
        SpringCM201411 service = new SpringCM201411();
        service.UploadDocument(id, type, name, document, sId);
        }

    public static string buildWorkflowXML(Map<String, String> objs, String sfType, String sId) {
        Set<String> oIds = objs.keySet();

        String xml = '';
        for (String oId : oIds) {
            xml += buildWorkflowXML(oId, sfType, sId, objs.get(oId));
            }
        if (xml.length() == 0) return xml;
        return '<salesforce>' + xml + '</salesforce>';
        }

    public static string buildWorkflowXML(string sfId, string sfType, string sId, String sfRecordType) {
        SpringCMEos.SpringCMUtilities.EOSObject eosResult = SpringCMEos.SpringCMUtilities.createEOSObject(sfId, sfType);
        if (eosResult == null) return '';

        system.debug('SFID: '+sfId+'\nType: '+sfType+'\nSession ID: '+sId);
        string xml = '';
        xml += '<object>';
        xml += '<id>' + eosResult.getSfId() + '</id>';
        xml += '<type>Salesforce.' + eosResult.getSfType() + '</type>';
        xml += '<foldername>';
        if (eosResult.getFoldername() != null)
            xml += eosResult.getFoldername().escapeXml();
        xml += '</foldername>';
        xml += '<path>';
        if (eosResult.getPath() != null)
             xml += eosResult.getPath().escapeXml();
        xml +=  '</path>';
        if (sfRecordType != null || sfRecordType != '') xml += '<recordType>' + sfRecordType + '</recordType>';
        xml += '</object>';
        return xml;
        }
    }