import { LightningElement, track, api } from 'lwc';

export default class RC_CWFrame extends LightningElement {

    iFrame;
    @api isReloaded = false;

    get frameUrl(){
            //return 'https://na.myconnectwise.net/v2024_1//ConnectWise.aspx?locale=en_US&routeTo=ServiceFV&srRecID=368832&fullscreen=false&chat=false#XQAACADP[…]_9UHgAA=';
            return 'https://na.myconnectwise.net';
        }

    renderedCallback(){
        console.log('rendered callback called ' + this.iFrame);
        if(this.iFrame == undefined){
            this.iFrame = this.template.querySelector('iframe');
            this.iFrame.onload = ()=>{
                console.log('Onload called ' + this.isReloaded);

                if(!this.isReloaded){
                    this.isReloaded = true;
                    this.iFrame.src = this.iFrame.src;
                }
            }
        }
    }





}