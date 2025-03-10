import {LightningElement, track, api} from 'lwc';
import {
    defaults
} from 'c/fsc_dualListBoxUtils';

export default class dualListBox extends LightningElement {

    @api label;
    @api sourceLabel;
    @api fieldLevelHelp;
    @api selectedLabel;

    @api min;
    @api max;
    @api disableReordering;
    @api size;
    @api required;
    @api requiredOptions;

    @api selectedValuesStringFormat;
    @api allOptionsStringFormat = defaults.csv;//csv;list;object
    @api useWhichObjectKeyForData = defaults.valueField;
    @api useWhichObjectKeyForLabel = defaults.labelField;
    @api useWhichObjectKeyForSort;
    @api useObjectValueAsOutput = false; //used with csv or list
    @track _options; //always json{label,value}
    @track _optionsOriginal; //stores original values
    _optionsOriginalMap;
    @track _value; //['value1','value2','value3']

    @api
    getValues(valueType) {
        return this.formatValuesGet(this._value, valueType);
    }

    @api
    getOptions(valueType) {
        return this.formatOptionsGet(this._options, valueType);
    }

    @api
    get selectedOptions() {
        return this.getValues(this.selectedValuesStringFormat);
    }

    set selectedOptions(value) {
        if (!this.isError) {
            this._value = this.formatValuesSet(value, this.selectedValuesStringFormat);
        }
    }

    @api
    get allOptions() {
        return this.getOptions(this.allOptionsStringFormat);
    }

    set allOptions(value) {
        if (!this.isError) {
            this._optionsOriginal = value;
            if (this.selectedValuesStringFormat === defaults.originalObject || this.selectedValuesStringFormat === defaults.twoLists) {
                this.setOriginalObjectMap();
            }
            if (this.useWhichObjectKeyForSort) {
                let formattedOptions = this.formatOptionsSet(value, this.allOptionsStringFormat);
                this._options = this.sortOptionsSet(formattedOptions, this.useWhichObjectKeyForSort);
            } else {
                this._options = this.formatOptionsSet(value, this.allOptionsStringFormat);
            }
        }
    }

    setOriginalObjectMap() {
        let resultValue = {};
        this._optionsOriginal.forEach(curItem => {
            resultValue[curItem[this.useWhichObjectKeyForData]] = curItem;
        });
        this._optionsOriginalMap = resultValue;
    }

    get isError() {
        // if (this.selectedValuesStringFormat === defaults.originalObject && this.allOptionsStringFormat !== defaults.originalObject) {
        //     return defaults.originalObjectOutputNotSupported;
        // }
        // if (this.allOptionsStringFormat !== defaults.originalObject &&
        //     (
        //         (this.useWhichObjectKeyForData || this.useWhichObjectKeyForLabel) &&
        //         this.useWhichObjectKeyForData !== defaults.valueField || this.useWhichObjectKeyForLabel !== defaults.labelField)
        // ) {
        //     return defaults.valueLabelFieldNamesNotSupported;
        // }
        // if (this.useObjectValueAsOutput && this.selectedValuesStringFormat === defaults.originalObject) {
        //     return defaults.canNotUseValuesForOutput;
        // }
    }

    sortOptionsSet(value, sortField) {
        if (!value) {
            return;
        }
        if (!sortField) {
            return value;
        }
        let fieldValue = row => row[sortField] || '';
        return [...value.sort(
            (a,b)=>(a=fieldValue(a).toUpperCase(),b=fieldValue(b).toUpperCase(),((a>b)-(b>a)))
        )];
    }

    formatValuesSet(value, optionType) {
        if (!value) {
            return;
        }
        if (optionType === defaults.csv) {
            return value.replace(/^ +| +$|( ) +/g, ' ').split(',');
        } else if (optionType === defaults.list || optionType === defaults.twoLists) {
            return value;
        } else if (optionType === defaults.originalObject) {
            return value.map(curItem => {
                return curItem[this.useWhichObjectKeyForData] ? curItem[this.useWhichObjectKeyForData] : curItem
            });
        }
    }

    formatValuesGet(items, optionType) {
        if (!items) {
            return;
        }
        let selectedValues = this.useObjectValueAsOutput ? items : items.map(curItem => {
            return this._options.find(curFilterItem => curItem === curFilterItem.value).label;
        });
        if (optionType === defaults.csv) {
            return selectedValues.join(',');
        } else if (optionType === defaults.list || optionType === defaults.twoLists) {
            return selectedValues;
        } else if (optionType === defaults.originalObject) {
            return items.map(curItemId => {
                return this._optionsOriginalMap ? this._optionsOriginalMap[curItemId] : {};
            });
        }
    }

    formatOptionsSet(items, optionType) {
        if (!items) {
            return;
        }
        if (optionType === defaults.csv) {
            let localItems = items.replace(/^ +| +$|( ) +/g, ' ').split(',');
            return localItems.map(curItem => {
                return {label: curItem, value: curItem}
            });
        } else if (optionType === defaults.list) {
            return items.map(curItem => {
                return {label: curItem, value: curItem}
            });
        } else if (optionType === defaults.originalObject || optionType === defaults.twoLists) {
            return items.map(curItem => {
                return {label: curItem[this.useWhichObjectKeyForLabel], value: curItem[this.useWhichObjectKeyForData]}
            });
        }
    }

    formatOptionsGet(items, optionType) {
        if (!items) {
            return;
        }
        if (optionType === defaults.csv) {
            return items.map(curItem => this.useObjectValueAsOutput ? curItem.value : curItem.label).join(',');
        } else if (optionType === defaults.list) {
            return items.map(curItem => this.useObjectValueAsOutput ? curItem.value : curItem.label);
        } else if (optionType === defaults.originalObject || optionType === defaults.twoLists) {
            return items.map(curItem => {
                return this._optionsOriginalMap ? this._optionsOriginalMap[curItem.value] : {};
            });
        }
    }

    handleChange(event) {
        this._value = event.detail.value;
        this.dispatchValueChangedEvent();
    }

    dispatchValueChangedEvent() {
        const valueChangedEvent = new CustomEvent('valuechanged', {
            detail: {
                value: this.getValues(this.selectedValuesStringFormat)
            }
        });
        this.dispatchEvent(valueChangedEvent);
    }
}