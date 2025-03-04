(function($, cke) {
  const valueHide = APP_CONGA_CKEDITOR.hideAttachments === "1";
  if (valueHide) {
    $("#formAddAttachment").hide();
  }
  // initialize CKEditor4 and set options
  cke.env.isCompatible = true;
  cke.replace("textAreaCKEditor", {
    toolbarCanCollapse: true,
    resize_enabled: false,
    removePlugins: "elementspath",
    disableNativeSpellChecker: false,
    customConfig: "",
    enterMode: CKEDITOR.ENTER_BR,
    autoParagraph: false,
    allowedContent: true,
    forceEnterMode: true,
    removeButtons: "",
    language: "en",
    toolbar: [
      {
        name: "document",
        items: ["NewPage", "Preview", "Print"]
      },
      {
        name: "clipboard",
        items: [
          "Cut",
          "Copy",
          "Paste",
          "PasteText",
          "PasteFromWord",
          "-",
          "Undo",
          "Redo"
        ]
      },
      {
        name: "editing",
        items: ["Find", "Replace", "-", "SelectAll"]
      },
      {
        name: "basicstyles",
        items: [
          "Bold",
          "Italic",
          "Underline",
          "Strike",
          "Subscript",
          "Superscript",
          "-",
          "RemoveFormat"
        ]
      },
      {
        name: "paragraph",
        items: [
          "NumberedList",
          "BulletedList",
          "-",
          "Outdent",
          "Indent",
          "-",
          "Blockquote",
          "-",
          "JustifyLeft",
          "JustifyCenter",
          "JustifyRight",
          "JustifyBlock",
          "-",
          "BidiLtr",
          "BidiRtl"
        ]
      },
      {
        name: "insert",
        items: [
          "Image",
          "Table",
          "HorizontalRule",
          "Smiley",
          "SpecialChar",
          "PageBreak"
        ]
      },
      {
        name: "links",
        items: ["Link", "Unlink", "Anchor"]
      },
      {
        name: "styles",
        items: ["Styles", "Format", "Font", "FontSize", "TextColor", "BGColor"]
      },
      {
        name: "source",
        items: ["Source"]
      }
    ]
  });

  // native JavaScript
  function showErrorMessage(message) {
    $("div#conga-spinner").hide();
    $("h2#errorMessageContent").text(message);
    $("div#errorMessageContainer").show();
  }

  function hideErrorMessage(message) {
    $("div#errorMessageContainer").hide();
  }

  function initializeGlobalVariable(congaEmailData) {
    if (congaEmailData.To === undefined) {
      congaEmailData.To = {};
    }
    if (congaEmailData.To.DisplayName === undefined) {
      congaEmailData.To.DisplayName = "";
    }
    if (congaEmailData.AdditionalTo === undefined) {
      congaEmailData.AdditionalTo = "";
    }
    if (congaEmailData.RelatedToId === undefined) {
      congaEmailData.RelatedToId = "";
    }
    if (congaEmailData.Bcc === undefined) {
      congaEmailData.Bcc = "";
    }
    if (congaEmailData.Cc === undefined) {
      congaEmailData.Cc = "";
    }
    if (congaEmailData.Content === undefined) {
      congaEmailData.Content = {};
    }
    if (congaEmailData.Content.Subject === undefined) {
      congaEmailData.Content.Subject = "";
    }
    if (congaEmailData.Content.Body === undefined) {
      congaEmailData.Content.Body = "";
    }
  }

  function appendAttachment(attachment) {
    $("div#attachmentsContainer").append(
      '<div class="slds-grid slds-wrap conga-file__row">' +
        '<div class="slds-col slds-size_9-of-12">' +
        '<div class="slds-form-element slds-p-vertical_x-small slds-p-horizontal_medium">' +
        attachment.FileName +
        "</div>" +
        "</div>" +
        '<div class="slds-col slds-size_3-of-12 slds-text-align_right">' +
        '<svg aria-hidden="true" class="congaBtnDeleteAttachments slds-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" data-docid="' +
        attachment.DocId +
        '">' +
        '<use xlink:href="/apexpages/slds/latest/assets/icons/utility-sprite/svg/symbols.svg#close"></use>' +
        "</svg>" +
        "</div>" +
        "</div>"
    );
  }

  // Get the metaHost from the Composer config. Used to call web services directly to add additional Attachments. 
  let metaHost;
  APXTConga4.EmailPreviewController.getMetaHost(function(result, event) {
      metaHost = result;
  });

  // jQuery/JavaScript remoting
  APXTConga4.EmailPreviewController.getInitData(
    APP_CONGA_CKEDITOR.operationId,
    APP_CONGA_CKEDITOR.isCommunityUsage,
    APP_CONGA_CKEDITOR.refreshToken,
    APP_CONGA_CKEDITOR.accessToken,
    APP_CONGA_CKEDITOR.congaAuthAccessType,
    APP_CONGA_CKEDITOR.congaAuthAccessKey,
    APP_CONGA_CKEDITOR.congaAuthAccessToken,
    function(result, event) {
      if (event.type === "exception") {
        showErrorMessage(event.message);
      } else if (event.status) {
        try {
          var parsedResult = JSON.parse(result);
          if (!parsedResult.success) {
            $("div#conga-spinner").hide();
            showErrorMessage(parsedResult.error.description);
            return;
          }
          APP_CONGA_CKEDITOR.congaEmailData = parsedResult.results[0];
          initializeGlobalVariable(APP_CONGA_CKEDITOR.congaEmailData);
          if (APP_CONGA_CKEDITOR.congaEmailData.To.DisplayName) {
            $("input#inputEmailTo").val(
              APP_CONGA_CKEDITOR.congaEmailData.To.DisplayName
            );
            $("span#pillEmailLabel").text(
              APP_CONGA_CKEDITOR.congaEmailData.To.DisplayName
            );
            $("span#pillEmailTo")
              .show()
              .addClass("conga-display__block");
            $("input#inputEmailTo").attr("disabled", true);
          } else {
            $("span#pillEmailTo").hide();
            $("input#inputEmailTo")
              .attr("disabled", false)
              .focus();
          }
          $("input#inputEmailAdditionalTo").val(
            APP_CONGA_CKEDITOR.congaEmailData.AdditionalTo
          );
          $("input#inputEmailCC").val(APP_CONGA_CKEDITOR.congaEmailData.Cc);
          $("input#inputEmailBCC").val(APP_CONGA_CKEDITOR.congaEmailData.Bcc);
          if (APP_CONGA_CKEDITOR.congaEmailData.RelatedTo) {
            $("input#inputEmailRelatedToType").val(
              APP_CONGA_CKEDITOR.congaEmailData.RelatedTo.RelatedToType
            );
            $("input#inputEmailRelatedToName").val(
              APP_CONGA_CKEDITOR.congaEmailData.RelatedTo.RelatedToName
            );
          } else {
            $("input#inputEmailRelatedToType").hide();
            $("input#inputEmailRelatedToName").hide();
          }
          $("input#inputEmailSubject").val(
            APP_CONGA_CKEDITOR.congaEmailData.Content.Subject
          );
          cke.instances.textAreaCKEditor.setData(
            APP_CONGA_CKEDITOR.congaEmailData.Content.Body
          );
          // append the Attachemnts to the DOM
          if (APP_CONGA_CKEDITOR.congaEmailData.Attachments) {
            for (
              var i = 0;
              i < APP_CONGA_CKEDITOR.congaEmailData.Attachments.length;
              i++
            ) {
              appendAttachment(APP_CONGA_CKEDITOR.congaEmailData.Attachments[i]);
            }
          }
          $("div#conga-spinner").hide();
        } catch (message) {
          showErrorMessage(message);
        }
      } else {
        showErrorMessage(event.message);
      }
    },
    {
      buffer: false,
      escape: false
    }
  );

  $("input#inputEmailTo").on("keyup", function(event) {
    var inputEmailTo = $(this).val();
    if (inputEmailTo.length < 2) {
      // SOSL queries require a minimum of 2 chars
      return;
    }
    APXTConga4.EmailPreviewController.getEmailTo(
      inputEmailTo,
      function(result, event) {
        if (event.type === "exception") {
          showErrorMessage(event.message);
        } else if (event.status) {
          APP_CONGA_CKEDITOR.searchResults = result;
          $("ul#inputEmailToContainer")
            .show()
            .children()
            .remove();
          var icon = "";
          var iconClass = "";
          for (var i = 0; i < result.length; i++) {
            if (result[i].ContactType === "Contact") {
              icon = "contact";
              iconClass = "conga-svg-icon-contact";
            } else if (result[i].ContactType === "User") {
              icon = "user";
              iconClass = "conga-svg-icon-user";
            } else if (result[i].ContactType === "Lead") {
              icon = "lead";
              iconClass = "conga-svg-icon-lead";
            }
            // append the search results to the DOM
            $("ul#inputEmailToContainer").append(
              '<li class="slds-lookup__item-action slds-lookup__result-text" data-id="' +
                result[i].Id +
                '">' +
                '<svg aria-hidden="true" class="slds-icon ' +
                iconClass +
                '" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                '<use xlink:href="/apexpages/slds/latest/assets/icons/standard-sprite/svg/symbols.svg#' +
                icon +
                '"></use>' +
                "</svg>" +
                '<div class="slds-show_inline-block slds-m-left_small">' +
                '<div class="slds-text-body--regular">' +
                result[i].Name +
                "</div>" +
                '<div class="slds-text-heading--label-normal">' +
                result[i].ContactType +
                "</div>" +
                "</div>" +
                "</li>"
            );
          }
        } else {
          showErrorMessage(event.message);
        }
      },
      {
        buffer: false,
        escape: false
      }
    );
  });

  // Handler for uploading additional attachments to the Email
  $("input#file-upload-input").on("change", async function(event) {
    var url = 'https://' 
    + metaHost 
    + '/c8/services/FileAttachment/' 
    + APP_CONGA_CKEDITOR.operationId
    + '?caid=' + APP_CONGA_CKEDITOR.congaAuthAccessToken
    + '&serverurl=null' // A real value isn't needed for the FileAttachment service, so omit it for simplicty
    + '&format=json' // Request the response in JSON (default is HTML)
    let attachment = (await addAttachment(url, $("form#formAddAttachment")[0])).results[0];
    APP_CONGA_CKEDITOR.congaEmailData.Attachments.push(attachment); // Add to the data model
    appendAttachment(attachment); // Add to the UI
  });

  // POST to the FileAttachment service and return the JSON response
  async function addAttachment(url, form) { 
    try {
      $("div#conga-spinner").show();
      const response = await fetch(url, {
        method: 'POST',
        body: new FormData(form),
      });
      if (!response.ok) {
        let errorString = `${response.status}` + (response.statusText ? ` ${response.statusText}` : "");
        throw new Error("Error adding Attachment: " + errorString);
      }
      let responseJSON = await response.json();
      return responseJSON;
    } catch (e) {
      showErrorMessage(e.message);
    } finally {
      $("div#conga-spinner").hide();
    }
  }

  $("button#sendEmail").on("click", function(event) {
    var inputEmailTo = $("input#inputEmailTo").val();
    var inputEmailAdditionalTo = $("input#inputEmailAdditionalTo").val();
    if (!inputEmailTo && !inputEmailAdditionalTo) {
      showErrorMessage(
        "No Email To address, please provide an Email To or Additional Email To address."
      );
      $("html, body").animate(
        {
          scrollTop: $("html").offset().top
        },
        "slow"
      );
      // $('input#inputEmailTo').focus();
      return;
    }
    $("div#conga-spinner").show();
    APP_CONGA_CKEDITOR.congaEmailData.To.DisplayName = inputEmailTo;
    APP_CONGA_CKEDITOR.congaEmailData.AdditionalTo = $(
      "input#inputEmailAdditionalTo"
    ).val();
    APP_CONGA_CKEDITOR.congaEmailData.Cc = $("input#inputEmailCC").val();
    APP_CONGA_CKEDITOR.congaEmailData.Bcc = $("input#inputEmailBCC").val();
    APP_CONGA_CKEDITOR.congaEmailData.Content.Subject = $(
      "input#inputEmailSubject"
    ).val();
    APP_CONGA_CKEDITOR.congaEmailData.Content.Body = cke.instances.textAreaCKEditor.getData();
    APXTConga4.EmailPreviewController.sendEmail(
      JSON.stringify(APP_CONGA_CKEDITOR.congaEmailData),
      APP_CONGA_CKEDITOR.operationId,
      APP_CONGA_CKEDITOR.isCommunityUsage,
      APP_CONGA_CKEDITOR.refreshToken,
      APP_CONGA_CKEDITOR.accessToken,
      APP_CONGA_CKEDITOR.congaAuthAccessType,
      APP_CONGA_CKEDITOR.congaAuthAccessKey,
      APP_CONGA_CKEDITOR.congaAuthAccessToken,
      function(result, event) {
        if (event.type === "exception") {
          showErrorMessage(event.message);
        } else if (event.status) {
          try {
            var emailResult = JSON.parse(result);
            if (!emailResult.success) {
              $("div#conga-spinner").hide();
              showErrorMessage(emailResult.error.description);
              return;
            }
            alert(
              "Email has been sent successfully! Click OK to navigate back to the record page."
            );
            sforce.one.navigateToURL(APP_CONGA_CKEDITOR.recordPageUrl, true);
          } catch (message) {
            showErrorMessage(message);
          }
          $("div#conga-spinner").hide();
        } else {
          showErrorMessage(event.message);
        }
      },
      {
        buffer: false,
        escape: false
      }
    );
  });

  $("svg#congaBtnCloseModal").on("click", function(event) {
    hideErrorMessage();
  });

  $("svg#congaBtnClosePill").on("click", function(event) {
    $("input#inputEmailTo")
      .val("")
      .attr("disabled", false)
      .focus();
    $("span#pillEmailTo").hide();
  });

  $(document).on("click", "ul#inputEmailToContainer>li", function(event) {
    for (var i = 0; i < APP_CONGA_CKEDITOR.searchResults.length; i++) {
      if (APP_CONGA_CKEDITOR.searchResults[i].Id === $(this).data("id")) {
        APP_CONGA_CKEDITOR.congaEmailData.To.Id =
          APP_CONGA_CKEDITOR.searchResults[i].Id;
        APP_CONGA_CKEDITOR.congaEmailData.To.AccountName = "";
        APP_CONGA_CKEDITOR.congaEmailData.To.ContactType =
          APP_CONGA_CKEDITOR.searchResults[i].ContactType;
        APP_CONGA_CKEDITOR.congaEmailData.To.DisplayName =
          APP_CONGA_CKEDITOR.searchResults[i].Name;
        APP_CONGA_CKEDITOR.congaEmailData.To.EmailAddress =
          APP_CONGA_CKEDITOR.searchResults[i].EmailAddress;
        hideErrorMessage();
        $("input#inputEmailTo")
          .val(APP_CONGA_CKEDITOR.congaEmailData.To.DisplayName)
          .attr("disabled", true);
        $("span#pillEmailLabel").text(
          APP_CONGA_CKEDITOR.congaEmailData.To.DisplayName
        );
        $("span#pillEmailTo")
          .show()
          .addClass("conga-display__block");
        $("ul#inputEmailToContainer").hide();
      }
    }
  });

  $(document).on("click", "svg.congaBtnDeleteAttachments", function(event) {
    var $this = $(this);
    var docId = $this.data("docid");
    for (
      var i = 0;
      i < APP_CONGA_CKEDITOR.congaEmailData.Attachments.length;
      i++
    ) {
      if (APP_CONGA_CKEDITOR.congaEmailData.Attachments[i].DocId === docId) {
        APP_CONGA_CKEDITOR.congaEmailData.Attachments.splice(i, 1);
      }
    }
    $this
      .parent()
      .parent(".slds-grid.slds-wrap")
      .remove();
  });

  $(document).on("click", function(event) {
    $("ul#inputEmailToContainer").hide();
  });
})(window.jQuery, window.CKEDITOR);
