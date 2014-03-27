//todo : vérifier en permanence que le mec est connecté
var host = "https://ws.paperus.fr";
var debug = true;
function log(mess) {
    if (debug) {
        console.log(mess);
    }
}

function init() {
	document.addEventListener("deviceready", deviceReady, true);
    deviceReady();
}

function checkPreAuth() {
    if(window.localStorage["email"] != undefined && window.localStorage["password"] != undefined) {
        var u= window.localStorage["email"];
        var p= window.localStorage["password"];
        var expire = new Date (window.localStorage["expireAt"]);
        var maintenant = new Date ();
        if (expire < maintenant) {
            var okbool = handleLogin(u, p);
            if (okbool) {
                window.localStorage["email"]=u;
                window.localStorage["password"]=p;
            } else {
                window.localStorage.removeItem("email");
                window.localStorage.removeItem("password");
            }
            return (okbool);
        } else {
            return (true);
        }
        } else {
            return (false);
    }
}

//fonction qui se charge de reconnecter en toute situation (appelée uniquement par checkPreAuth)
function handleLogin(u,p) {
    if(u != '' && p!= '') {
        var bool = false;
        var current = $("#email");
        $.ajax({
               type:'POST',
               url: host + "/2/sessions",
               data: {email:u,password:p},
               async: false,
               statusCode:
               {
               200 : function(res){
               //j'enregistre l'id, le mot de passe, le token et la date de fin
               window.localStorage["token"]=res.token;
               window.localStorage["expireAt"]=res.expireAt;
               bool = true;
               },
               401 : function(){
               self.showAlert(current, "Connexion impossible, le couple identifiant/mot de passe n'a pas été reconnu", "erreur");
               },
               400 : function(){
               self.showAlert(current, "votre champs email ne contient pas un email valide", "erreur");
               },
               500: function(){
               self.showAlert(current, "Le serveur vient de rencontrer une erreur inattendue, nous avons enregistré le problème.", "erreur");
               },
               404: function(){
               self.showAlert(current, "le serveur ne répond pas, il semble y avoir un problème...", "erreur");
               }
               },
               dataType: "JSON"
               });
    } else {
        self.showAlert(current, "L'un des champs est resté vide", "erreur");
    }
    return (bool);
}

function onGlobal(){
    $(document).on("pageshow", "#login", function() {
                   if(checkPreAuth()){openScanBarcode();}
                   });
    $(document).on("pageshow",  "#scanBarcode", function(event, ui) {
                   resetScanBarcode();
                   } );
    $(document).on("pageshow", "#chooseContent", function (event, ui) {
                   drawContents();
                   } );
    $(document).on("pageshow",  "#visualizeTag", function(event, ui) {
                   drawTags();
                   } );
    $(document).on("pageshow",  "#settings", function(event, ui) {
                   $('#account').append(' '+window.localStorage["email"]+'.');
                   } );
    $(document).on("pageshow", "#subscription", function() {
                   $("#subscriptionForm").on("submit",login);
                   });

}
//fonction appelée ailleurs pour ouvrir proprement la page login
function openLogin(){
    $.mobile.pageContainer.pagecontainer('change', "#login");   
}

//fonction appelée ailleurs pour ouvrir proprement la page scanBarcode
function openScanBarcode(){
    $.mobile.pageContainer.pagecontainer('change', "#scanBarcode");


  //  $(':mobile-pagecontainer').pagecontainer('change', '#scanbarcode', { changeHash: false, showLoadMsg: true });
}

//fonction appelée ailleurs pour ouvrir proprement la page chooseContent
function openChooseContent() {
    $.mobile.pageContainer.pagecontainer('change', "#chooseContent");
}

//fonction appelée ailleurs pour ouvrir proprement la page visualizeTag
function openVisualizeTag(){
    $.mobile.pageContainer.pagecontainer('change', "#visualizeTag");
}

//fonction appelée ailleurs pour ouvrir proprement la page settings
function openSettings(){
    $(':mobile-pagecontainer').pagecontainer('change', '#settings');
}

//fonction appelée ailleurs pour ouvrir proprement la page subscription
function openSubscription(){
    $(':mobile-pagecontainer').pagecontainer('change', '#subscription');
}

//fonction appelée par init qui vérifie si nous avons des identifiants, nous connecte le cas échéant ou nous propose de nous connecter
function deviceReady() {
    $(document).on("pageshow", "#launching", function(event, ui){
                   $("body").addClass("ios7");
                   onGlobal();
                   liveForm();
                   if (checkPreAuth()){
                        openScanBarcode();
                   } else {
                        openLogin();
                   }
                   });
}

//fonction qui permet d'afficher une alerte même si le système natif n'est pas accessible
function showAlert(current, message, title) {
    if (navigator.notification) {
        navigator.notification.alert(message, null, title, 'OK');
    } else {
   	//var popup= $("#popupBasic");
   	var popup = current.parents('div[data-role="page"]').find(".popupBasic");
   	popup.find("h2").html(title);
   	popup.find("p").html(message);
   	popup.popup();
   	popup.popup("open", null);
    }
}

function showModal(current, message, title,confirm, cancel) {
    if (navigator.notification) {
        navigator.notification.confirm(
                                       message,
                                       onconfirm,
                                       title,
                                       'OK, annuler');
        
    } else {
    	var initpopup = current.parents('div[data-role="page"]').find(".modalBasic");
        var popup = initpopup.clone();
        initpopup.after(popup);
        var id = "m_" + Math.floor(Math.random() * 20000);
        popup.attr("id", id);
        popup.attr("class","");

        $("#" + id).find("h2").html(title);
        $("#" + id).find("p").html(message);
        $("#" + id).popup();
        $("#" + id + " #okbutton").on("click", function () {
            if (confirm) {
                confirm();
            }
        });
        $("#" + id + " #kobutton").on("click", function () {
            $("#" + id).popup('close');
            if (cancel) {
                cancel();
            }
        });
        $("#" + id).popup("open", { role: "dialog"});
    }
}

//fonction de connection appelée depuis index.html
//fonction qui récupère le token et le mot de passe
function login(){
    //disable the button so we can't resubmit while we wait :
    var u = $("#email").val();
    var p = $("#password").val();
    var current = $("#email");
    if(u != '' && p!= '') {
        $.ajax({
               type:'POST',
               url: host + "/2/sessions",
               data: {email:u,password:p},
               async: false,
               statusCode:
               {
               200 : function(res){
               //j'enregistre l'id, le mot de passe, le token et la date de fin
               window.localStorage["email"] = u;
               window.localStorage["password"] = p;
               window.localStorage["token"]=res.token;
               window.localStorage["expireAt"]=res.expireAt;
               openScanBarcode();
               },
               401 : function(){
               self.showAlert(current,"Connexion impossible, le couple identifiant/mot de passe n'a pas été reconnu", "erreur");
               },
               400 : function(){
               self.showAlert(current,"votre champs email ne contient pas un email valide", "erreur");
               },
               500: function(){
               self.showAlert(current,"Le serveur vient de rencontrer une erreur inattendue, nous avons enregistré le problème.", "erreur");
               },
               404: function(){
               self.showAlert(current,"le serveur ne répond pas, il semble y avoir un problème...", "erreur");
               }
               },
               dataType: "JSON"
               });
    } else {
	    self.showAlert(current,"Le login et mot de passe sont obligatoire","erreur");    
	   //		$('#popupLogin').popup("open");

	    }
    return false;
}

//fonction qui est appelée par scanBarcode et qui récupère la liste des ISBNs vendus pui va chercher avec obtainContent les contenus.
function obtainAllContent(){
    //event.preventDefault();
    var ISBNList=[];
    var current = $("#eanField");

    $("input[type=text]").each(function(){
        if (this.name == "ISBN" && $(this).val() != ''){
            ISBNList.push($(this).val());
        }
    });
    if (ISBNList.length > 0) {
        for (var i = 0, c = ISBNList.length; i < c; i++) {
            obtainContent(ISBNList[i], current);
        }
        openChooseContent();
    }
    else {
        self.showAlert(current, "vous n'avez saisi aucun ISBN","Information");
    }
    return false;
}

//fonction qui récupère le contenu associé à un ISBN appelée depuis scanBarcode.html
function obtainContent(i, current){
    var URL = host + '/2/contents';
    var contentElem;
    if(i != '') {
        $.ajax({
            //type: 'GET',
            url: URL +"?isbn="+i+"&grouped=true",
            //contentType: "application/json",
            dataType: "json",
            beforeSend: setHeader,
            //data: {isbn:i, grouped:true},
            async: false,
            statusCode: {
                200: function (res) {
                        //Je teste si ma zone de stockage pour contenus a été initialisée
                        if (window.sessionStorage["contenus"] != undefined) {
                            //Si oui alors j'ajoute le nouveau contenu à mon tableau et je sauvegarde également l'ISBN associé
                            var ISBNList = JSON.parse(window.sessionStorage["ISBNContentList"]);
                            ISBNList.push(i);
                            window.sessionStorage["ISBNContentList"] = JSON.stringify(ISBNList);
                            var JSONTabContent = JSON.parse(window.sessionStorage["contenus"]);
                            JSONTabContent.push(JSON.stringify(res));
                            window.sessionStorage["contenus"] = JSON.stringify(JSONTabContent);
                        } else {
                            //Sinon j'initialise
                            window.sessionStorage["ISBNContentList"] = JSON.stringify([i]);
                            window.sessionStorage["contenus"] = JSON.stringify([JSON.stringify(res)]);
                        }
                    },
                400: function(){
                    self.showAlert(current, "votre champs ISBN ne contient pas un ISBN valide", "erreur");
                    },
                401: function(){
                    self.showAlert(current, "Connexion impossible, Vous avez été déconnecté", "erreur");
                    if (checkPreAuth()) {
                        self.showAlert(current, "reconnecté ! réessayez", "information");
                    } else {
                        self.showAlert(current, "reconnexion impossible, vérifiez vos identifiants","erreur");
                        logout();
                        }
                    },
                404: function(){
                    //je teste si ma zone de stockage pour ISBNNoContentList a été initialisée
                    if (window.sessionStorage["ISBNNoContentList"]!= undefined){
                        //Si oui alors j'ajoute le nouvel ISBN à mon tableau
                        var ISBNNoContentList = JSON.parse(window.sessionStorage["ISBNNoContentList"]);
                        ISBNNoContentList.push(i);
                        window.sessionStorage["ISBNNoContentList"]=JSON.stringify(ISBNNoContentList);
                    } else {
                    //Sinon j'initialise
                        window.sessionStorage["ISBNNoContentList"]=JSON.stringify([i]);
                    }
                    },
                500: function(){
                    self.showAlert(current, "erreur interne au serveur, veuillez réessayer plus tard", "erreur");
                    }
                    }
            });
    } else {
        $("#submit").removeAttr("disabled");
    }
    return false;
}

//je place le header comme le veulent tous les WS sauf tags et sessions.
function setHeader(xhr){
    xhr.setRequestHeader('X-Paperus-Session', window.localStorage["token"]);
}
// header spécifique pour tags où j'ajoute que je veux une bae 64
function setHeaderTags(xhr){
    setHeader(xhr);
    xhr.setRequestHeader('Accept', 'image/png+base64');
}


//Fonction appelée par makeCodes qui va créer en sessionStorage deux tableaux : ISBNSelected et ContentSelected à partir de ce qu'a sélectionné l'utilisateur dans son formulaire ChoosContent.html
function memorizeContentSelected(ids){
    var idSelected=ids
    var contentSelected = [];
    var ISBNSelected = [];
    var content={};
    var contentsList = JSON.parse(window.sessionStorage["contenus"]);
    var contentInOneISBN = [];
    var ISBNList= JSON.parse(window.sessionStorage["ISBNContentList"]);
    for (var i=0, c=idSelected.length; i<c; i++){
        for (var j=0, d=ISBNList.length; j<d; j++){
            contentInOneISBN = JSON.parse(contentsList[j]);
            for (var k=0, e=contentInOneISBN.length; k<e; k++){
                content = contentInOneISBN[k];
                if (content.id == idSelected[i]){
                    idSelected[i]="default";
                    contentSelected.push(content);
                    ISBNSelected.push(ISBNList[j]);
                }
                content={};
            }
            contentInOneISBN = [];
        }
    }
    window.sessionStorage["ISBNSelected"] = JSON.stringify(ISBNSelected);
    window.sessionStorage["contentSelected"] = JSON.stringify(contentSelected);
}

//fontion appelée par makeCodes qui renvoie le tableau des ids sélectionnés
function selectedIds (){
    var selectedItems=[];
    $("input[type=checkbox]:checked").each(function(){
                                           selectedItems.push($(this).attr('name'));
                                           });
    return selectedItems;
}

//fonction globale appelée par chooseContent.html, elle parcourt la liste des contenus, ajoute ceux qui sont sélectionnés à un tableau puis pour chacun des éléments du tableau elle appelle generateQRCode
//je dois créer des tableaux : content qui contient : {ISBN, res.contentText} puis contentSelected qui contient {ISBN, res.contentText}
//je parcourt les deux, l'un pour
function makeCodes(){
    var ISBNSelected=[];
    var current=$("#choice");
    // je récupère dans un tableau ma liste des Ids sélectionnés
    var selectedItems = selectedIds();
    // Je mémorise les infos relatives à ces Ids
    memorizeContentSelected(selectedItems);
    var contentSelected = JSON.parse(window.sessionStorage["contentSelected"]);
    ISBNSelected = JSON.parse(window.sessionStorage["ISBNSelected"]);
    //Je calcule le total à rajouter à la vente du livre physique
    var total = calculateTotal(contentSelected);
    if (total > 0) {
        self.showModal(current, "Avez vous bien facturé " + total + " euros au client en plus de sa commande de livres physiques ? Sinon, annuler et rester sur cette page", "information", function () {
                       for (i=0, c=selectedItems.length; i<c; i++){
                       generateQRCode(ISBNSelected[i], contentSelected[i].id, current);
                       }
                       openVisualizeTag();
                       });
    } else {
        for (i=0, c=selectedItems.length; i<c; i++){
            generateQRCode(ISBNSelected[i], contentSelected[i].id, current);
        }
        openVisualizeTag();
    }
        return false;
}

// fonction qui calcule le total à régler par le lecteur en fonction des choix sélectionnés par le libraire
function calculateTotal(contentSelected){
    var total= 0;
    var contentPrice = 0;
    if (contentSelected != ''){
        for (var i=0, c=contentSelected.length; i<c; i++){
            contentPrice = contentSelected[i].price;
            total = total + contentPrice;
        }
        return total;
    } else {
        return total;
    }
}

//fonction qui envoie le formulaire d'inscription
function subscribe (){
    var name = $("#name").val();
    var firstname = $("#firstname").val();
    var email = $("#emailsubscribe").val();
    var phone = $("#phone").val();
    var bookstoreCommercialName = $("#bookstoreCommercialName").val();
    var bookstoreEntity = $("#bookstoreEntity").val();
    var RCSNumber = $("#RCSNumber").val();
    var bookstoreRIB = $("#bookstoreRIB").val();
    var current = $("#RCSNumber");
    if(name != '' && firstname != '' && email != '' && phone != '' && bookstoreCommercialName != '' &&  bookstoreEntity  != '' && RCSNumber != '') {
        $.ajax({
               type:'POST',
               url: host + "/2/Registers",
               data: {
                firstName:firstname,
                lastName:name,
                phoneNumber:phone,
                email:email,
                bookstoreName:bookstoreCommercialName,
                companyName:bookstoreEntity,
                rcsNumber:RCSNumber,
                iban:bookstoreRIB
                },
               async: false,
               statusCode:
               {
               200 : function(res){
               self.showAlert(current,"Nous avons bien reçu votre demande d'inscription, vous serez rencontactés très prochainnement","Merci,");
               },
               401 : function(){
               self.showAlert(current,"Connexion impossible, nous n'avons pas reçu toutes vos données, réessayez plus tard", "erreur");
               },
               400 : function(){
               self.showAlert(current,"Connexion impossible, nous n'avons pas reçu toutes vos données, réessayez plus tard", "erreur");               },
               500: function(){
               self.showAlert(current,"Connexion impossible, nous n'avons pas reçu toutes vos données, réessayez plus tard", "erreur");               },
               404: function(){
               self.showAlert(current,"Connexion impossible, nous n'avons pas reçu toutes vos données, réessayez plus tard", "erreur");               }
               },
               dataType: "JSON"
               });
    } else {
	    self.showAlert(current,"Tous les champs obligatoires n'ont pas été remplis","erreur");
    }
    return false;
}

//je génère un tableau appelé 'tags' que j'ai en mémoire et que je pourrai parcourir plus tard.
//fonction qui génère le tag, appelée depuis chooseContent.html
function generateQRCode(i, objectID, current){
    var URL = host + '/2/tags';
    //var i= $("#ISBN").val();
    //var objectID= $("#objID").val();
        if (objectID!='') {
        $.ajax({
               type: "POST",
               url: URL,
               dataType: "image/png+base64",
               beforeSend: setHeaderTags,
               data: {isbn:i,contents:  objectID},
               async: false,
               statusCode: {
                      200: function(res){
                            if (window.sessionStorage["tagList"]!=undefined){
                                var tag = {};
                                var tagList = JSON.parse(window.sessionStorage["tagList"]);
                                var textualTag = res.getResponseHeader('X-Paperus-Tag');
                                var QRCode = res.responseText;
                                tag = {
                                    isbn : i,
                                    link : textualTag,
                                    QRCode : QRCode,
                                    };
                                tagList.push(tag);
                                window.sessionStorage["tagList"]= JSON.stringify(tagList);
                            } else {
                                var tag = {};
                                var tagList = [];
                                var textualTag = res.getResponseHeader('X-Paperus-Tag');
                                var QRCode = res.responseText;
                                tag = {
                                    isbn : i,
                                    link : textualTag,
                                    QRCode : QRCode,
                                    };
                                tagList.push(tag);
                                window.sessionStorage["tagList"]= JSON.stringify(tagList);
                            }
                           },
                      400: function(){
                           self.showAlert(current, "votre champs ISBN ne contient pas un ISBN valide", "erreur");
                           },
                      401: function(){
                            self.showAlert(current, "Connexion impossible, Vous avez été déconnecté", "erreur");
                            if (checkPreAuth()) {
                                self.showAlert(current, "reconnecté ! réessayez", "information");
                            } else {
                                self.showAlert(current, "reconnexion impossible, vérifiez vos identifiants","erreur");
                                logout();
                                }
                            },
                      404: function(){
                           self.showAlert(current, "il n'y a pas de code à afficher", "erreur");
                           },
                      410: function(){
                           self.showAlert(current, "tous les codes pour cette opération promotionnelle ont été vendus", "erreur");
                           },
                      500: function(){
                           self.showAlert(current, "erreur interne au serveur, veuillez réessayer plus tard", "erreur");
                           },
                    },
               
               });
               } else {
                self.showModal(current, "vous n'avez sélectionné aucun contenu, retour à l'accueil ?", "information",
                    function () {
                        sessionStorage.clear();
                        openScanBarcode();
                    });
               }
               return false;
}

//fontion pour revenir à l'accueil et effacer la vente actuelle TODO savoir où je suis
function backToHome(current){
    var bool = false;
    var activePage = $.mobile.activePage.attr("id");
    if (activePage == "visualizeTag") {
        self.showModal(current, "les codes ont-ils tous été scannés ? Sinon, annuler et rester sur cette page", "information", function () {
            sessionStorage.clear();
            openScanBarcode();
        });
    } else {
        if (activePage == "scanBarcode") {
            self.showModal(current, "effacer les codes saisis et reprendre au début ?", "information", function (){
                           resetScanBarcode();
                           $.mobile.changePage(
                                               window.location.href,
                                               {
                                               allowSamePageTransition : true,
                                               transition              : 'none',
                                               showLoadMsg             : false,
                                               reloadPage              : true
                                               }
                                               );});
        } else {
        self.showModal(current, "annuler cette vente et reprendre du début ?", "information", function () {
            sessionStorage.clear();
            openScanBarcode();
        });
        }
    }
}

//fonction de déconnexion !TODO : savoir où je suis
function logout() {
	var current=$("#account");
    self.showModal(current, "Souhaitez-vous vraiment vous déconnecter ?", "information", function () {
        self.showAlert(current, "Déconnexion en cours", "information");
        sessionStorage.clear();
        localStorage.clear();
        openLogin();
    });
}

//fonction appelée par ScanBarcode qui ajoute à la volée des champs EAN13
function liveForm() {
    $(document).on("keypress", "#ISBN", function (event) {
        if (event.which == 13) {
            event.preventDefault();
            $.get('js/template.html', function(template) {
                var html = $(template).filter('#tpl-ISBN').html();
                $('#eanField').append(html);
                $('#eanField').find("#ISBN").last().focus();
                  }, 'html');
        }
    });
}

//fonction qui génère la page chooseContent.html
function drawContents() {
    $('#articleKOContent').html('');
    $('#articleOKContent').html('');
    if (window.sessionStorage["ISBNNoContentList"]!= undefined){
        $.get('js/template.html', function(template) {
              // charge le fichier templates et récupère le contenu de la
              var ISBNNoContent= {"ISBN":JSON.parse(window.sessionStorage["ISBNNoContentList"])};
              var template = $(template).filter('#tpl-noContent').html();
              var html = Mustache.to_html(template, ISBNNoContent);
              $('#articleKOContent').html(html);
              },'html'); }
    if (window.sessionStorage["ISBNContentList"]!= undefined){
        $.get('js/template.html', function(template) {
              // charge le fichier templates et récupère le contenu de la
              var ISBNContentList = [];
              var ISBNContent= {};
              var Contents = JSON.parse(window.sessionStorage["contenus"]);
              var ISBNList= JSON.parse(window.sessionStorage["ISBNContentList"]);
              for (var i=0, c=ISBNList.length; i<c; i++){
                ISBNContent.ISBN = ISBNList.pop();
                var content = JSON.parse(Contents.pop());
                for (var j=0, d=content.length; j<d; j++){
                    content[j] = { content : content[j], idCheckBox : Math.floor(Math.random() * 100000) + 1}
                }
                ISBNContent.content = content;
                ISBNContentList.push(ISBNContent);
                ISBNContent={};
                }
              var template = $(template).filter('#tpl-contentList').html();
              ISBNContentList={ISBNList: ISBNContentList};
              var html = Mustache.to_html(template, ISBNContentList);
              $('#articleOKContent').html(html).trigger('create');
              },'html');}
    
}

//fonction qui génère la page visualizeTag.html
function drawTags(){
    if (window.sessionStorage["tagList"]!= undefined){
        $.get('js/template.html', function(template) {
              // charge le fichier templates et récupère le contenu de la
              var ISBNTagList = JSON.parse(window.sessionStorage["tagList"]);
              var template = $(template).filter('#tpl-QRCode').html();
              ISBNTagList={ISBNTagList: ISBNTagList};
              var html = Mustache.to_html(template, ISBNTagList);
              $('#Code').html(html);
              },'html');}
    
}

//fonction appelée par le formulaire de scanBarcode pour remettre celui-ci à 0
function resetScanBarcode(){
    $("input[type=text]").each(function () { $(this).val(''); });
    $("#eanField").html('');
    return false;
}

//fonction appelée par scanbarcode qui ajoute une ligne
function addISBN(){
    $.get('js/template.html', function(template) {
          var html = $(template).filter('#tpl-ISBN').html();
          $('#eanField').append(html);
          $('#eanField').find("#ISBN").last().focus();
          }, 'html');
}

