/**
 * Email to Case Premium Knowledge Extension
 * This class is used to provide Email to Case Premium with the ability to obtain Knowledge Article Categories and Groups on the New Comment page when searching knowledge.
 * This code cannot be packaged because a reference to Schema.describeDataCategoryGroups() and the like surprisingly causes an error while building packages even though there are no organization specific knowledge object references.
 * A note of interest is that this code does compile in organizations that do not have knowledge enabled so no dependency would have been introduced if this were able to be packaged. An exception is thrown when knowledge is disabled.
 */
@SuppressWarnings('PMD.AvoidGlobalModifier')
global class E2CPKnowledgeExtension implements Callable {
    /**
     * Callable interface implementation so that E2CP managed code can invoke this class
     * @param action The action to perform
     * @param args The arguments to pass to the action if applicable
     * @return The result of the action
     */
    public Object call(String action, Map<String,Object> args){
        switch on action {
            when 'getCategoryGroupsJSON' {
                return JSON.serialize(new CategoryGroups());
            }
            when else {
                throw new IllegalArgumentException('Action `' + action + '` does not exist.');
            }
        }
    }
    
    /**
     * Holds information about all the Knowledge groups and categories
     */
    private class CategoryGroups {
        public List<GroupInfo> groups;

        /**
         * Initialize groups with all the Knowledge groups and categories
         */
        private CategoryGroups() {
            this.groups = new List<GroupInfo>();
            try {
                for (DescribeDataCategoryGroupResult catGroup : Schema.describeDataCategoryGroups(new List<String>{'KnowledgeArticleVersion'})) {
                    this.groups.add(new GroupInfo(catGroup));
                }
            } catch(Exception e) {
                System.debug(e.getMessage()); //Knowledge disabled is a common scenario
            }
        }
    }
    
    /**
     * Holds information about a Knowledge group and its categories
     */
    @testVisible
    private class GroupInfo {
        public String name;
        public String label;
        public CategoryInfo root; //The root category is the 'All' category (can be renamed though) which there can only be exactly one of and cannot be deleted

        /**
         * Initialize the group info with the given DescribeDataCategoryGroupResult
         * @param catGroup The DescribeDataCategoryGroupResult to initialize the group info with
         */
        @testVisible
        private GroupInfo(DescribeDataCategoryGroupResult catGroup) {
            this.name = catGroup?.getName();
            this.label = catGroup?.getLabel();

            DataCategoryGroupSobjectTypePair groupType = new Schema.DataCategoryGroupSobjectTypePair();
            groupType.setDataCategoryGroupName(catGroup?.getName());
            groupType.setSobject('KnowledgeArticleVersion');
            List<DataCategoryGroupSobjectTypePair> groupTypes = new List<DataCategoryGroupSobjectTypePair>{groupType};
            List<DescribeDataCategoryGroupStructureResult> groupCategoryInfo = Schema.describeDataCategoryGroupStructures(groupTypes, false);
            if (!groupCategoryInfo.isEmpty()) {
                List<DataCategory> top = groupCategoryInfo[0].getTopCategories(); //Top is the 'All' category (can be renamed though)
                if (!top.isEmpty()) {
                    this.root = new CategoryInfo(top[0]);
                }
            }
        }
    }
    
     /**
     * Holds information about a Knowledge category and its children
     */
    @testVisible
    private class CategoryInfo {
        public String name;
        public String label;
        public List<CategoryInfo> children;

        /**
         * Initialize the category info with the given DataCategory
         * @param category The DataCategory to initialize the category info with
         */
        @testVisible
        private CategoryInfo(DataCategory category) {
            this.name = category?.getName();
            this.label = category?.getLabel();
            this.children = loadChildCategories(category);
        }

        /**
         * Load the child categories for the given parent category
         * @param parent The parent category to load the child categories for
         * @return all children
         */
        private List<CategoryInfo> loadChildCategories(DataCategory parent) {
            List<CategoryInfo> children = new List<CategoryInfo>();
            for (DataCategory child : parent?.getChildCategories() ?? new List<DataCategory>{}) {
                children.add(new CategoryInfo(child));
            }
            return children;
        }
    }
}