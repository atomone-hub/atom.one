import "../css/main.css";
/** CONSTANTS */
const website = {};
/**
 * LOG SALUTATION
 * @param {object} publics
 */
(function Log(publics) {
    const userAgent = navigator.userAgent.toLowerCase();
    const supported = /(chrome|firefox)/;
    publics.init = function () {
       
            console.log(`
 ______     __   __     ______     ______   ______    
/\  ___\   /\ "-.\ \   /\  __ \   /\  == \ /\  ___\   
\ \ \__ \  \ \ \-.  \  \ \ \/\ \  \ \  _-/ \ \___  \  
 \ \_____\  \ \_\\"\_\  \ \_____\  \ \_\    \/\_____\ 
  \/_____/   \/_/ \/_/   \/_____/   \/_/     \/_____/ 
                                                      
`);
        
    };
})(website);
(function () {
    website.init();
})();
