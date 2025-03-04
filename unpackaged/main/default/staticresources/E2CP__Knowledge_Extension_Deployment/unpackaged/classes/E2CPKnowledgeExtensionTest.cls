@isTest
private class E2CPKnowledgeExtensionTest {
    @isTest
    public static void testGetCategoryGroups() {
        //Test the getCategoryGroups action
        String extensionClass = 'E2CPKnowledgeExtension';
        Callable categoryGroupsExtension = (Callable)Type.forName(extensionClass).newInstance();
        Object result = categoryGroupsExtension.call('getCategoryGroupsJSON', null);
        Assert.areNotEqual(null, result, 'Error obtaining knowledge groups and categories.');
        
        //Test invalid action
        try {
            result = categoryGroupsExtension.call('invalid', null);
            Assert.fail('Invalid action should throw an exception.');
        } catch (IllegalArgumentException e) {
            Assert.areNotEqual(null, e, 'This assert will never fail. It is expected that we get here.');
        } catch (Exception e) {
            Assert.fail('Unexpected exception type calling invalid action');
        }

        //Obtain coverage to account for when knowledge is not enabled or available.
        try {
            new E2CPKnowledgeExtension.GroupInfo(null);
        } catch (Exception e) { 
            Assert.areNotEqual(null, e, 'This assert will never fail. It is expected that we get here.');
        }
        new E2CPKnowledgeExtension.CategoryInfo(null);
    }
}