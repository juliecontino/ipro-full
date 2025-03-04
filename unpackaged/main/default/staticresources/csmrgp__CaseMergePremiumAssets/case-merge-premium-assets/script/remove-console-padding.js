/**
 * In Salesforce Console, there is a class on the body '.hasMotif' that adds 10 pixels of padding to the left and right side
 * of the page. This will cause the page header to look a bit strange. This function removes that class from the body.
*/
function removeConsolePadding() {
    document.body.classList.remove('hasMotif');
}