/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global abstract class Tab {
    global dfsle.Tab.Anchor anchor {
        get;
    }
    global dfsle.Tab.Condition condition {
        get;
    }
    global dfsle.UUID customTabId {
        get;
    }
    global String dataLabel {
        get;
    }
    global List<String> groupDataLabels {
        get;
    }
    global dfsle.Tab.GuidedForm guidedForm {
        get;
    }
    global dfsle.UUID id {
        get;
    }
    global String name {
        get;
    }
    global Integer order {
        get;
    }
    global dfsle.Tab.Position position {
        get;
    }
    global dfsle.Tab.SmartContract smartContract {
        get;
    }
    global dfsle.Tab.Type tabType {
        get;
    }
    global String tooltip {
        get;
    }
    global dfsle.Tab withAnchor(dfsle.Tab.Anchor anchor) {
        return null;
    }
    global dfsle.Tab withCondition(dfsle.Tab.Condition condition) {
        return null;
    }
    global dfsle.Tab withCustomTabId(dfsle.UUID customTabId) {
        return null;
    }
    global dfsle.Tab withDataLabel(String dataLabel) {
        return null;
    }
    global dfsle.Tab withGroupDataLabels(List<String> groupDataLabels) {
        return null;
    }
    global dfsle.Tab withGuidedForm(dfsle.Tab.GuidedForm guidedForm) {
        return null;
    }
    global dfsle.Tab withId(dfsle.UUID id) {
        return null;
    }
    global dfsle.Tab withName(String name) {
        return null;
    }
    global dfsle.Tab withOrder(Integer order) {
        return null;
    }
    global dfsle.Tab withPosition(dfsle.Tab.Position position) {
        return null;
    }
    global dfsle.Tab withSmartContract(dfsle.Tab.SmartContract smartContract) {
        return null;
    }
    global dfsle.Tab withTooltip(String tooltip) {
        return null;
    }
global class Anchor {
    global Boolean allowWhiteSpace {
        get;
    }
    global Boolean caseSensitive {
        get;
    }
    global String horizontalAlignment {
        get;
    }
    global Boolean ignoreIfNotPresent {
        get;
    }
    global Boolean matchWholeWord {
        get;
    }
    global String text {
        get;
    }
    global String units {
        get;
    }
    global Integer xOffset {
        get;
    }
    global Integer yOffset {
        get;
    }
    global Anchor(String text) {

    }
    global Anchor(String text, Boolean allowWhiteSpace, Boolean caseSensitive, String horizontalAlignment, Boolean ignoreIfNotPresent, Boolean matchWholeWord, String units, Integer xOffset, Integer yOffset) {

    }
}
global class Collaboration {
    global Boolean canCollaborate {
        get;
    }
    global Boolean required {
        get;
    }
    global Boolean requireInitialOnChange {
        get;
    }
    global Collaboration(Boolean canCollaborate, Boolean required, Boolean requireInitialOnChange) {

    }
}
global enum ComponentType {Child, Field, Lookup, SObj}
global class Condition {
    global String parentDataLabel {
        get;
    }
    global String parentValue {
        get;
    }
    global Condition(String parentDataLabel, String parentValue) {

    }
}
global class Formatting {
    global Boolean bold {
        get;
    }
    global String color {
        get;
    }
    global Boolean concealValue {
        get;
    }
    global Boolean fixedWidth {
        get;
    }
    global String font {
        get;
    }
    global Boolean italic {
        get;
    }
    global Integer size {
        get;
    }
    global Boolean underline {
        get;
    }
    global Formatting(String font, String color, Integer size, Boolean bold, Boolean italic, Boolean underline, Boolean concealValue, Boolean fixedWidth) {

    }
}
global class GuidedForm {
    global Integer order {
        get;
    }
    global String pageLabel {
        get;
    }
    global Integer pageNumber {
        get;
    }
    global GuidedForm(Integer order, String pageLabel, Integer pageNumber) {

    }
}
global class MergeField {
    global String path {
        get;
    }
    global List<dfsle.Tab.PathComponent> pathExtended {
        get;
    }
    global Integer row {
        get;
    }
    global Boolean senderReadOnly {
        get;
    }
    global Boolean writeBack {
        get;
    }
    global MergeField(String path, List<dfsle.Tab.PathComponent> pathExtended, Integer row, Boolean writeBack, Boolean senderReadOnly) {

    }
}
global class PathComponent {
    global String name {
        get;
    }
    global String salesforceType {
        get;
    }
    global dfsle.Tab.ComponentType type {
        get;
    }
    global PathComponent(String name, dfsle.Tab.ComponentType type, String salesforceType) {

    }
}
global class Position {
    global Integer documentSequence {
        get;
    }
    global Integer height {
        get;
    }
    global Integer pageNumber {
        get;
    }
    global Integer width {
        get;
    }
    global Integer x {
        get;
    }
    global Integer y {
        get;
    }
    global Position(Integer documentSequence, Integer pageNumber, Integer x, Integer y, Integer width, Integer height) {

    }
}
global class SmartContract {
    global String code {
        get;
    }
    global String uri {
        get;
    }
    global SmartContract(String code, String uri) {

    }
}
global enum Type {Approve, Checkbox, CommentThread, Company, DateSigned, DateTab, Decline, Draw, Email, EmailAddress, EnvelopeId, FirstName, Formula, FullName, InitialHere, LastName, ListTab, Notarize, Note, NumberTab, Payment, PolyLineOverlay, RadioGroup, SignerAttachment, SignHere, SmartSection, Ssn, TabGroup, Text, Title, View, Zip}
global class Validation {
    global String errorMessage {
        get;
    }
    global Integer maximumLength {
        get;
    }
    global String pattern {
        get;
    }
    global Validation(Integer maximumLength, String pattern, String errorMessage) {

    }
}
}
