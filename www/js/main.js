//todo : vérifier en permanence que le mec est connecté

function init() {
	document.addEventListener("deviceready", deviceReady, true);
	delete init;
}

function checkPreAuth() {
    if(window.localStorage["email"] != undefined && window.localStorage["password"] != undefined) {
        var u= window.localStorage["email"];
        var p= window.localStorage["password"];
        var okbool = handleLogin(u, p);
        return (okbool);
    } else {
        return (false);    }
}

//fonction qui se charge de reconnecter en toute situation (appelée uniquement par checkPreAuth)
function handleLogin(u,p) {
    if(u != '' && p!= '') {
        $.ajax({
               type:'POST',
               url: "http://dev-ws.paperus.fr/2/sessions",
               data: {email:u,password:p},
               statusCode:
               {
               200 : function(res){
               //j'enregistre l'id, le mot de passe, le token et la date de fin
               window.localStorage["token"]=res.token;
               window.localStorage["expireAt"]=res.expireAt;
               window.location = "scanBarcode.html";
               },
               401 : function(){
               self.showAlert("Connexion impossible, le couple identifiant/mot de passe n'a pas été reconnu", "erreur");
               },
               400 : function(){
               self.showAlert("votre champs email ne contient pas un email valide", "erreur");
               },
               500: function(){
               self.showAlert("Le serveur vient de rencontrer une erreur inattendue, nous avons enregistré le problème.", "erreur");
               },
               404: function(){
               self.showAlert("le serveur ne répond pas, il semble y avoir un problème...", "erreur");
               }
               },
               dataType: "JSON"
               });
    } else {
        self.showAlert("L'un des champs est resté vide", "erreur");
    }
    return false;
}

function deviceReady() {
	console.log("deviceReady");
	$("#loginPage").on("pageinit",function() {
		console.log("pageinit run");
		$("#loginForm").on("submit",handleLogin);
		checkPreAuth();
	});
	$.mobile.changePage("#loginPage");
}

//fonction qui permet d'afficher une alerte même si le système natif n'est pas accessible
function showAlert(message, title) {
    if (navigator.notification) {
        navigator.notification.alert(message, null, title, 'OK');
    } else {
        alert(title ? (title + ": " + message) : message);
    }
}

function showModal(message, title) {
    var returnBool = false;
    if (navigator.notification) {
        navigator.notification.confirm(
                                       message,
                                       onconfirm,
                                       title,
                                       'OK, annuler');
        
    } else {
        returnBool = confirm(title ? (title + ": " + message) : message);
    }
    return (returnBool);
}

//fonction de connection appelée depuis index.html
function login(){
    //disable the button so we can't resubmit while we wait :
    $("#submit").attr("disabled","disabled");
    var u = $("#email").val();
    var p = $("#password").val();
    if(u != '' && p!= '') {
        $.ajax({
               type:'POST',
               url: "http://dev-ws.paperus.fr/2/sessions",
               data: {email:u,password:p},
               statusCode:
               {
               200 : function(res){
               //j'enregistre l'id, le mot de passe, le token et la date de fin
               window.localStorage["email"] = u;
               window.localStorage["password"] = p;
               window.localStorage["token"]=res.token;
               window.localStorage["expireAt"]=res.expireAt;
               window.location = "scanBarcode.html";
               },
               401 : function(){
               self.showAlert("Connexion impossible, le couple identifiant/mot de passe n'a pas été reconnu", "erreur");
               },
               400 : function(){
               self.showAlert("votre champs email ne contient pas un email valide", "erreur");
               },
               500: function(){
               self.showAlert("Le serveur vient de rencontrer une erreur inattendue, nous avons enregistré le problème.", "erreur");
               },
               404: function(){
               self.showAlert("le serveur ne répond pas, il semble y avoir un problème...", "erreur");
               }
               },
               dataType: "JSON"
               });
        $("#submit").removeAttr("disabled");
    } else {
        self.showAlert("L'un des champs est resté vide", "erreur");
        $("#submit").removeAttr("disabled");
    }
    return false;
}

//fonction qui est appelée par scanBarcode et qui récupère la liste des ISBNs vendus pui va chercher avec obtainContent les contenus.
function obtainAllContent(){
    console.log("j'entre dans obtainAllContent");
    var ISBNList=[];
    $("input[type=text]").each(function(){
                               console.log("j'entre dans .each");
                       ISBNList.push($(this).val());
                      // var i=$("#ISBN").val();
                       });
    console.log("j'ai maintenant ça dans ISBNList : "+ISBNList);
    for (var i=0, c=ISBNList.length; i<c; i++){
        console.log("je suis dans ma boucle for, tour "+i);
        obtainContent(ISBNList[i]);
    }
    //window.location = "chooseContent.html";
}

//fonction qui récupère le contenu associé à un ISBN appelée depuis scanBarcode.html
function obtainContent(i){
    var URL = 'http://dev-ws.paperus.fr/2/contents';
    var contentElem;
    if(i != '') {
        $.ajax({
            type: "GET",
            url: URL,
            dataType: JSON,
            beforeSend: setHeader,
            data: {isbn:i, grouped:true},
            async: false,
            statusCode: {
                200: function(res){
                    //Je teste si ma zone de stockage pour contenus a été initialisée
                    if (window.sessionStorage["contenus"]!= undefined){
                        //Si oui alors j'ajoute le nouveau contenu à mon tableau et je sauvegarde également l'ISBN associé
                        var ISBNList = JSON.parse(window.sessionStorage["ISBNContentList"]);
                        ISBNList.push(i);
                        window.sessionStorage["ISBNContentList"]=JSON.stringify(ISBNList);
                        var JSONTabContent = JSON.parse(window.sessionStorage["contenus"]);
                        JSONTabContent.push(res.responseText);
                        window.sessionStorage["contenus"]=JSON.stringify(JSONTabContent);
                        } else {
                            //Sinon j'initialise
                            window.sessionStorage["ISBNContentList"]=JSON.stringify([i]);
                            window.sessionStorage["contenus"]=JSON.stringify([res.responseText]);
                            }
                        window.location = "chooseContent.html";
                    },
                400: function(){
                    self.showAlert("votre champs ISBN ne contient pas un ISBN valide", "erreur");
                    },
                401: function(){
                    self.showAlert("Connexion impossible, Vous avez été déconnecté", "erreur");
                    if (checkPreAuth()) {
                        self.showAlert("reconnecté ! réessayez", "information");
                    } else {
                        self.showAlert("reconnexion impossible, vérifiez vos identifiants","erreur");
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
                    self.showAlert("erreur interne au serveur, veuillez réessayer plus tard", "erreur");
                    }
                    }
            });
    } else {
        self.showAlert("vous n'avez saisi aucun ISBN");
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
    var contentSelected = [];
    var ISBNSelected = [];
    var content={};
    var contentsList = JSON.parse(window.sessionStorage["contenus"]);
    var contentInOneISBN = [];
    var ISBNList= JSON.parse(window.sessionStorage["ISBNContentList"]);
    for (var i=0, c=ids.length; i<c; i++){
        for (var j=0, d=ISBNList.length; j<d; j++){
            contentInOneISBN = JSON.parse(contentsList[j]);
            for (var k=0, e=contentInOneISBN.length; k<e; k++){
                content = contentInOneISBN[k];
                if (content.id == ids[i]){
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
                                           selectedItems.push($(this).attr('id'));
                                           });
    return selectedItems;
}
//fonction globale appelée par chooseContent.html, elle parcourt la liste des contenus, ajoute ceux qui sont sélectionnés à un tableau puis pour chacun des éléments du tableau elle appelle generateQRCode
//je dois créer des tableaux : content qui contient : {ISBN, res.contentText} puis contentSelected qui contient {ISBN, res.contentText}
//je parcourt les deux, l'un pour
function makeCodes(){
    var ISBNSelected=[];
    // je récupère dans un tableau ma liste des Ids sélectionnés
    var selectedItems = selectedIds();
    // Je mémorise les infos relatives à ces Ids
    memorizeContentSelected(selectedItems);
    var contentSelected = JSON.parse(window.sessionStorage["contentSelected"]);
    ISBNSelected = JSON.parse(window.sessionStorage["ISBNSelected"]);
    //Je calcule le total à rajouter à la vente du livre physique
    var total = calculateTotal(contentSelected);
    if (total>0){self.showModal("Avez vous bien facturé " +total+ " euros au client en plus de sa commande de livres physiques ? Sinon, annuler et rester sur cette page", "information");}
    // et maintenant pour tous les contenus sélectionnés je vais chercher un tag
    for (i=0, c=selectedItems.length; i<c; i++){
        generateQRCode(ISBNSelected[i], selectedItems[i]);
    }
    //maintenant que j'ai tout préparé, je passe à la présentation de mes codes
    window.location = "visualizeTag.html";
}

// fonction qui calcule le total à régler par le lecteur en fonction des choix sélectionnés par le libraire
function calculateTotal(contentSelected){
    var total= 0;
    var contentPrice = 0;
    if (contentSelected != ''){
        for (var i=0, c=contentSelected.length; i<c; i++){
            contentPrice = contentSelected[i].price;
            console.log(contentPrice);
            total = total + contentPrice;
        }
        return total;
    } else {
        return total;
    }
}

//je génère un tableau appelé 'tags' que j'ai en mémoire et que je pourrai parcourir plus tard.
//fonction qui génère le tag, appelée depuis chooseContent.html
function generateQRCode(i, objectID){
    var URL = 'http://dev-ws.paperus.fr/2/tags';
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
                                console.log(tagList);
                                window.sessionStorage["tagList"]= JSON.stringify(tagList);
                            }
                           },
                      400: function(){
                           self.showAlert("votre champs ISBN ne contient pas un ISBN valide", "erreur");
                           },
                      401: function(){
                            self.showAlert("Connexion impossible, Vous avez été déconnecté", "erreur");
                            if (checkPreAuth()) {
                                self.showAlert("reconnecté ! réessayez", "information");
                            } else {
                                self.showAlert("reconnexion impossible, vérifiez vos identifiants","erreur");
                                logout();
                                }
                            },
                      404: function(){
                           self.showAlert("il n'y a pas de code à afficher", "erreur");
                           },
                      410: function(){
                           self.showAlert("tous les codes pour cette opération promotionnelle ont été vendus", "erreur");
                           },
                      500: function(){
                           self.showAlert("erreur interne au serveur, veuillez réessayer plus tard", "erreur");
                           },
                    },
               
               });
               } else {
                   self.showAlert("vous n'avez sélectionné aucun contenu, retour à l'accueil", "information")
                    sessionStorage.clear();
                    window.location = "scanBarcode.html";
               }
               return false;
}

function backToHome(){
    var bool = false;
    if (window.location != "visualizeTag.html") {
        bool = self.showModal("Annuler cette vente et revenir à l'accueil ?", "information");
    } else {
        bool = self.showModal("les codes ont-ils tous été scannés ? Sinon, annuler et rester sur cette page", "information");
    }
    if (bool) {
    sessionStorage.clear();
    window.location = "scanBarcode.html";
    }
}

function logout(){
    if (self.showModal("Souhaitez-vous vraiment vous déconnecter ?", "information")) {
        self.showAlert("Déconnexion en cours", "information");
        sessionStorage.clear();
        localStorage.clear();
        window.location = "index.html";
    }
}


