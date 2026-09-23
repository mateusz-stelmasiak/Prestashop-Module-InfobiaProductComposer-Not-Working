stk = Array();

function alertInfobia(msg, timeInfobia = 3000) {

    $('#danger-alert-infobia').show()
    $("#danger-alert-infobia").find("strong").html(msg);
    $("#danger-alert-infobia").css("display", "block");
    $("#danger-alert-infobia").fadeTo(timeInfobia, 500).slideUp(500, function () {
        $("#danger-alert-infobia").slideUp(500);
    });
    return -1

}

function checkboxImgQty(obj, action) {

    //Min et max de l'option
    min_attrib_option = obj.parent("div").attr("min_attr_option")
    max_attrib_option = obj.parent("div").attr("max_attr_option")
    if (action != null)
        obj.parents(".infobiaCheckbox").find("input[type='checkbox']").prop('checked', true)

    //background et couleur text
    obj.parents(".infobiaCheckbox").find("p").css('color', color_text);
    obj.parents(".infobiaCheckbox").find(".infobiaCheckboxContent").css('background', background);
    qteTota = 0

    // alert(value)

    if (action == "keyup") {

        val_rest = obj.parents('.div_checkbox').find("input[name='reste']").val()

        if (parseInt(value) < parseInt(min)) {
            obj.parents(".infobiaCheckbox").find("input[type='checkbox']").prop('checked', false)
            obj.parents(".infobiaCheckbox").find("input[type='number']").css("border", "2px solid red")
            if (min===max) {msg = "Liczba elementów tej kategorii musi być równa " + min;}
            else{msg = "Liczba elementów tej kategorii musi być pomiędzy " + min + " a " + max;}
            alertInfobia(msg)
            //value=min
        } else if (parseInt(value) > parseInt(max_attrib_option)) {

            obj.parents(".infobiaCheckbox").find("input[type='checkbox']").prop('checked', false)
            obj.parents(".infobiaCheckbox").find("input[type='number']").css("border", "2px solid red")

            if (min===max) {msg = "Liczba elementów tej kategorii musi być równa " + min;}
            else{msg = "Liczba elementów tej kategorii musi być pomiędzy " + min + " a " + max;}

            alertInfobia(msg)
            //value=min
        } else if (parseInt(value) > parseInt(max)) {

            obj.parents(".infobiaCheckbox").find("input[type='checkbox']").prop('checked', false);
            obj.parents(".infobiaCheckbox").find("input[type='number']").css("border", "2px solid red");
            if (min===max) {msg = "Liczba elementów tej kategorii musi być równa " + min;}
            else{msg = "Liczba elementów tej kategorii musi być pomiędzy " + min + " a " + max;}
            alertInfobia(msg);
            //value=max

            console.log(val_rest + "/////////" + max)
            if (parseInt(value) > parseInt(val_rest)) {
                if (min===max) {msg = "Liczba elementów tej kategorii musi być równa " + min;}
                else{msg = "Liczba elementów tej kategorii musi być pomiędzy " + min + " a " + max;}
                alertInfobia(msg)
            }
        } else {
            obj.parents(".infobiaCheckbox").find("input[type='number']").css("border", "1px solid grey");
        }

    } //fin keyup

    //DELETED clicking minus when quantity 0 sets to one TODO
    // if (value == 0) {
    //     value = parseInt(default_attr)
    //
    // } else {
    //     if (val == "plus") {
    //         value = parseInt(value) + 1
    //     }
    //     if (val == "minus") {
    //         value = value - 1
    //     }
    // }

    if (val == "plus") {
        value = parseInt(value) + 1
    }
    if (val == "minus" && value!=0) {
        value = value - 1
    }

    if (parseInt(value) == parseInt(min)) {
        obj.parents('.infobiaCheckbox').find(".btnminus").prop('disabled', true);
        obj.parents('.infobiaCheckbox').find(".btnminus").css('opacity', 0.2);
    } else {
        obj.parents('.infobiaCheckbox').find(".btnminus").prop('disabled', false);
        obj.parents('.infobiaCheckbox').find(".btnminus").css('opacity', 1);
    }

    obj.parents(".infobiaCheckbox").find("input[type='number']").val(value);


    $(obj.parents(".div_checkbox").find("input[type='number']")).each(function () {

        if ($(this).parents(".infobiaCheckbox").find("input[type='checkbox']").is(':checked')) {

            min_attr_checkbox = $(this).parent(".plusminusDiv").attr("min_attr")
            max_attr_checkbox = $(this).parent(".plusminusDiv").attr("max_attr")
            val_checkbox = $(this).val()

            if (parseInt(val_checkbox) >= parseInt(max_attr_checkbox)) {
                qteTota = qteTota + parseInt(val_checkbox)

                console.log($(this).parents(".infobiaCheckbox").find(".btnplus").html())
                $(this).parents(".infobiaCheckbox").find(".btnplus").prop("disabled", true)
                $(this).parents(".infobiaCheckbox").find(".btnplus").css("opacity", 0.2)
                msg = "Liczba elementów tej kategorii musi być pomiędzy  " + min_attr_checkbox + " a " + max_attr_checkbox
                obj.parents(".infobiaCheckbox").find("input[type='number']").val(value);
                return -1
            } else if (parseInt(val_checkbox) == 0) {
                obj.parents(".infobiaCheckbox").find("input[type='checkbox']").prop('checked', false)

                obj.parents(".infobiaCheckbox").find("p").css('color', 'black');
                obj.parents(".infobiaCheckbox").find(".infobiaCheckboxContent").css('background', 'none');
            }
            qteTota = qteTota + parseInt(val_checkbox)

        }// fin is checked
    });


    reste = max_attrib_option - qteTota

    obj.parents('.div_checkbox').find("input[name='reste']").val(reste)
    if (parseInt(qteTota) >= parseInt(max_attrib_option)) {
        if (parseInt(qteTota) > parseInt(max_attrib_option)) {
            msg = "Liczba elementów tej kategorii musi być pomiędzy  " + min_attrib_option + " a " + max_attrib_option
            alertInfobia(msg)
        }

        obj.parents('.div_checkbox').find(".btnplus").prop('disabled', true);
        obj.parents('.div_checkbox').find(".btnplus").css('opacity', 0.2);
        // disabled checkbox
        obj.parents(".div_checkbox").find("input:checkbox:not(:checked)").prop('disabled', true)

        return -1


    } else {
        obj.parents('.div_checkbox').find(".btnplus").prop('disabled', false);
        $(obj.parents(".div_checkbox").find("input[type='number']")).each(function () {

            max_attr_checkbox = $(this).parent(".plusminusDiv").attr("max_attr")
            val_checkbox = $(this).val()

            if (parseInt(val_checkbox) >= parseInt(max_attr_checkbox)) {
                $(this).parents('.infobiaCheckbox').find(".btnplus").prop('disabled', true);
            }
        });

        obj.parents(".div_checkbox").find("input:checkbox:not(:checked)").prop('disabled', false)
        obj.parents('.div_checkbox').find(".btnplus").css('opacity', 1);

        $(obj.parents(".div_checkbox").find(".plusminusDiv")).each(function () {
            if ($(this).attr('min_attr') > reste && $(this).find("input[type='number']").val() == 0) {


                $(this).find(".btnplus").prop('disabled', true);
                $(this).find(".btnplus").css('opacity', 0.2);
            }
        });
    }
}

function selectQty(obj, action) {

    hasQte = obj.parents(".SelectInfobia").find("option:selected").attr("hasQte")
    //alert(hasQte)
    min = obj.parents(".SelectInfobia").find("option:selected").attr("minAttrib")
    max = obj.parents(".SelectInfobia").find("option:selected").attr("maxAttrib")

    defaultNbAttrib = obj.parents(".SelectInfobia").find("option:selected").attr("defaultNbAttrib")


    obj.parents('.SelectInfobia').find("input[type=number]").val(defaultNbAttrib)

    obj.parents(".SelectInfobia").find(".plusminus").prop('disabled', false);
    obj.parents(".SelectInfobia").find(".plusminus").css('opacity', '1');
    if (action == "keyup") {
        obj.parents(".SelectInfobia").find("input[type='number']").css("border", "1px solid grey")
        if (parseInt(value) < parseInt(min)) {
            msg = "Liczba elementów tej kategorii musi być pomiędzy  " + min + " a " + max
            alertInfobia(msg)
            obj.parents(".SelectInfobia").find("input[type='number']").css("border", "2px solid red")

        } else if (parseInt(value) > parseInt(max)) {

            msg = "Liczba elementów tej kategorii musi być pomiędzy  " + min + " a " + max
            alertInfobia(msg)

            obj.parents(".SelectInfobia").find("input[type='number']").css("border", "2px solid red")


        } else {

            obj.parents(".SelectInfobia").find("input[type=number]").val(parseInt(value))
            // return -1
        }
    }
    if (val == "plus") {
        if (parseInt(value) + 1 >= max) {

            obj.parents(".SelectInfobia").find(".btnplus").prop('disabled', true);
            obj.parents(".SelectInfobia").find(".btnplus").css('opacity', '0.2');
            msg = "Liczba elementów tej kategorii musi być pomiędzy  " + min + " a " + max
            alertInfobia(msg)
            return -1


        }


    }
    if (val == "minus") {
        if (parseInt(value) <= min) {

            obj.parents(".SelectInfobia").find(".btnminus").prop('disabled', true);
            obj.parents(".SelectInfobia").find(".btnminus").css('opacity', '0.2');
            msg = "Liczba elementów tej kategorii musi być pomiędzy  " + min + " a " + max
            alertInfobia(msg)
            // alert("min atteint")
            return -1
        }
    }

    obj.parents(".SelectInfobia").find("input[type=number]").val(parseInt(value))


}

function radioImgQty(obj, action) {
    obj.parents(".divInfobiaRadio").find("input[type='radio']").prop('checked', true)
    obj.parents(".RadioImgInfobia").find("input[type='number']").val(0);
    obj.parents(".divInfobiaRadio").find("input[type=number]").val(parseInt(value))
    obj.parents(".RadioImgInfobia").find("input[type='number']").css("border", "1px solid grey")
    obj.parents('.RadioImgInfobia').find(".plusminus").prop('disabled', false);
    obj.parents('.RadioImgInfobia').find(".plusminus").css('opacity', 1);
    obj.parents(".RadioImgInfobia").find("p").css('color', 'black');
    obj.parents(".RadioImgInfobia").find(".classRadioInfobia").css('background', 'none');
    obj.parents(".divInfobiaRadio").find("p").css('color', color_text);
    obj.parents(".divInfobiaRadio").find(".classRadioInfobia").css('background', background);

    if (action == "keyup") {
        if (parseInt(value) < parseInt(min)) {
            obj.parents(".divInfobiaRadio").find("input[type='number']").css("border", "2px solid red")
            obj.parents(".divInfobiaRadio").find("input[type='radio']").prop('checked', false)
            obj.parents(".divInfobiaRadio").find("p").css('color', 'black');
            obj.parents(".divInfobiaRadio").find(".classRadioInfobia").css('background', 'none');
            msg = "Liczba elementów tej kategorii musi być pomiędzy " + min + " a " + max
            alertInfobia(msg)
            return -1
        } else if (parseInt(value) > parseInt(max)) {
            obj.parents(".divInfobiaRadio").find("input[type='number']").css("border", "2px solid red")
            obj.parents(".divInfobiaRadio").find("input[type='radio']").prop('checked', false)
            obj.parents(".divInfobiaRadio").find("p").css('color', 'black');
            obj.parents(".divInfobiaRadio").find(".classRadioInfobia").css('background', 'none');
            msg = "Liczba elementów tej kategorii musi być pomiędzy  " + min + " a " + max

            alertInfobia(msg)
            return -1
        } else {
            obj.parents(".divInfobiaRadio").find("input[type=number]").val(parseInt(value))
        }
    }


    if (val == "minus") {
        //CHANGED from ==
        if (value - 1 < 0) {
            obj.parents(".divInfobiaRadio").find("input[type='radio']").prop('checked', false)
            obj.parents(".divInfobiaRadio").find("p").css('color', '#000');
            obj.parents(".divInfobiaRadio").find(".classRadioInfobia").css('background', 'none');

        }

        if (parseInt(value) - 1 <= min) {

            obj.parents('.divInfobiaRadio').find(".btnminus").prop('disabled', true);
            obj.parents('.divInfobiaRadio').find(".btnminus").css('opacity', 0.2);
            return -1
        }
    }

}

function radioQty(obj, action) {
    obj.parents(".RadioInfobia").find("input[type='number']").val(0)
    if (action == "keyup") {
        obj.parents(".divInfobiaRadio").find("input[type='number']").val(value)
        obj.parents(".RadioInfobia").find("input[type='number']").css("border", "1px solid grey")

        if (parseInt(value) < parseInt(min)) {

            msg = "Liczba elementów tej kategorii musi być pomiędzy  " + min + " a " + max
            alertInfobia(msg)
            obj.parents(".divInfobiaRadio").find("input[type='number']").css("border", "2px solid red")
            obj.parents(".divInfobiaRadio").find("input[type='radio']").prop('checked', false)
            return -1


        } else if (parseInt(value) > parseInt(max)) {

            msg = "Liczba elementów tej kategorii musi być pomiędzy  " + min + " a " + max
            alertInfobia(msg)

            obj.parents(".divInfobiaRadio").find("input[type='number']").css("border", "2px solid red")
            obj.parents(".divInfobiaRadio").find("input[type='radio']").prop('checked', false)

            return -1
        } else {
            obj.parents(".divInfobiaRadio").find("input[type='number']").css("border", "1px solid gey")
            obj.parents(".divInfobiaRadio").find("input[type=number]").val(parseInt(value))

        }

    }
    obj.parents(".divInfobiaRadio").find("input[type='radio']").prop('checked', true)
    obj.parents('.RadioInfobia').find(".plusminus").prop('disabled', false);
    obj.parents('.RadioInfobia').find(".plusminus").css('opacity', 1);


    if (val == "minus") {

        if (value - 1 == 0) {

            obj.parents(".divInfobiaRadio").find("input[type='radio']").prop('checked', false)

        }

        if (parseInt(value) - 1 <= min) {

            obj.parents(".divInfobiaRadio").find("input[type='radio']").prop('checked', false)
            obj.parents('.divInfobiaRadio').find(".btnminus").prop('disabled', true);
            obj.parents('.divInfobiaRadio').find(".btnminus").css('opacity', 0.2);
            //return -1
        }
    }
    if (val == "plus") {

        if (parseInt(value) + 1 >= max) {

            obj.parents('.divInfobiaRadio').find(".btnplus").prop('disabled', true);
            obj.parents('.divInfobiaRadio').find(".btnplus").css('opacity', 0.2);
            obj.parents(".divInfobiaRadio").find("input[type='number']").val(value)

        }

    }
    resultPrice()
}

/* The remaining allowance for one checkbox group, recomputed from the DOM.
 *
 * The original code kept "reste" by adding and subtracting as boxes were
 * ticked, which drifted: unticking a box never gave its slot back, so the
 * counter ran negative and every other box in the group stayed disabled for
 * good. Counting what is actually ticked cannot drift.
 */
function infobiaRecount(scope) {

    if (!scope || scope.length === 0) {
        return
    }

    var group = scope.first()
    var mine = function () {
        return $(this).closest(".div_checkbox")[0] === group[0]
    }

    var max = parseInt(group.find(".plusminusDiv").first().attr("max_attr_option"), 10)
    if (isNaN(max)) {
        max = parseInt(group.parents(".divOptionInfobia").first().find(".titleOption").attr("max_attr_option"), 10)
    }
    if (isNaN(max)) {
        return
    }

    var tiles = group.find(".infobiaCheckbox").filter(mine)
    var used = 0

    tiles.each(function () {
        var box = $(this).find("input[type='checkbox']").first()
        var field = $(this).find("input[type='number']").first()

        if (!box.is(":checked")) {
            // An unticked box owns nothing, whatever the field says.
            field.val(0)
            return
        }

        if (field.length === 0) {
            used = used + 1
            return
        }

        var n = parseInt(field.val(), 10)
        if (isNaN(n) || n < 0) {
            n = 0
        }
        used = used + n
    })

    var reste = max - used
    if (reste < 0) {
        reste = 0
    }
    group.find("input[name='reste']").filter(mine).val(reste)

    tiles.each(function () {
        var box = $(this).find("input[type='checkbox']").first()
        var field = $(this).find("input[type='number']").first()
        var plus = $(this).find(".btnplus")
        var minus = $(this).find(".btnminus")
        var ticked = box.is(":checked")

        // A box you have not ticked is only offered while a slot is free.
        box.prop("disabled", !ticked && reste <= 0)

        var n = parseInt(field.val(), 10)
        if (isNaN(n)) {
            n = 0
        }
        var cap = parseInt($(this).find(".plusminusDiv").attr("max_attr"), 10)
        var floor = parseInt($(this).find(".plusminusDiv").attr("min_attr"), 10)
        if (isNaN(floor)) {
            floor = 0
        }

        var canAdd = ticked && reste > 0 && (isNaN(cap) || n < cap)
        plus.prop("disabled", !canAdd).css("opacity", canAdd ? 1 : 0.2)

        var canDrop = ticked && n > floor
        minus.prop("disabled", !canDrop).css("opacity", canDrop ? 1 : 0.2)
    })
}

function updateQuantite(obj, action = null) {

    qteTota = 0

    min = obj.parent("div").attr("min_attr")
    max = obj.parent("div").attr("max_attr")
    default_attr = obj.parent("div").attr("default_attr")
    value = obj.parent("div").find("input[type=number]").val()
    val = obj.val()

    typeAttr = obj.parents(".plusminusDiv").attr("type")


    //checkbox without img
    if (typeAttr == "checkbox") {
        checkboxImgQty(obj, action)
    }

    if (typeAttr == "select") {
        selectQty(obj, action)
    }
    if (typeAttr == "radioImage") {
        radioImgQty(obj, action)
    }
    if (typeAttr == "radio") {
        radioQty(obj, action)
    }

    if (typeAttr != "checkbox" && typeAttr != "checkboxImg") {

        if (val == "plus") {
            if (parseInt(value) >= max) {
                msg = "Liczba elementów tej kategorii musi być pomiędzy " + min + " a " + max
                alertInfobia(msg)
                return -1
            }
        }
        if (val == "minus") {
            if (parseInt(value) <= min) {
                msg = "Liczba musi być pomięzy " + min + " et " + max
                alertInfobia(msg)
                return -1
            }
        }
    } //fin type not checkbox

    if (typeAttr != "checkbox" && typeAttr != "checkboxImg") {

        if (val == "plus") {

            if (parseInt(value) == 0 && min > 0) {
                obj.parent("div").find("input[type=number]").val(default_attr)
            } else {
                obj.parent("div").find("input[type=number]").val(parseInt(value) + 1)
            }

        }
        if (val == "minus") {
            obj.parent("div").find("input[type=number]").val(parseInt(value) - 1)
        }

    }  //fin type not checkbox

    infobiaRecount(obj.closest(".div_checkbox"))

    resultPrice()
}


function checkQty() {

    msg = ""
    $(".titleOption").each(function (index) {
        qty = 0
        min_attr_option = $(this).attr("min_attr_option")
        max_attr_option = $(this).attr("max_attr_option")
        type_option = $(this).attr("type_option")
        name_option = $(this).attr("name_option")

        if (type_option == "checkbox" || type_option == "checkbox_img") {
            $(this).parents(".divOptionInfobia").find("input[type='checkbox']:checked").each(function (index) {
                qty = qty + parseInt($(this).parents(".infobiaCheckbox").find("input[type='number']").val())
            });
            //CHANGED TODO CHECK
            // if (parseInt(qty) < parseInt(min_attr_option)) {
            //     if (msg != "") msg = msg + "<br>"
            //     if (min_attr_option === max_attr_option) {
            //         msg += "Musisz wybrać " + min_attr_option + " pozycji w kategorii " + name_option
            //     } else {
            //         msg += "Musisz wybrać między  " + min_attr_option + " a " + max_attr_option + " pozycji w kategorii " + name_option
            //     }
            // }
            if (parseInt(qty) < parseInt(min_attr_option) || parseInt(qty)>parseInt(max_attr_option)) {
                if (msg != "") msg = msg + "<br>"
                if (min_attr_option === max_attr_option) {
                    msg += "Musisz wybrać " + min_attr_option + " pozycji w kategorii " + name_option
                } else {
                    msg += "Musisz wybrać między  " + min_attr_option + " a " + max_attr_option + " pozycji w kategorii " + name_option
                }
            }
        }


    }); // fin foreach

    if (msg != "") {

        alertInfobia(msg, 8000)
        return false
    } else {
        return true
    }

}

function resultPrice() {


    prixBase = $("#initialprice").val()
    prixFinal = 0
    prixFinalRed = 0
    priceradio = 0
    priceselect = 0
    pricecheckbox = 0
    qty = 1

    /************Selct list*************/
    $("#divInfobia select").each(function (index) {
        var id = $(this).attr('id')

        display_fils = "";
        if ($(this).closest(".fils_attrib").length > 0) {
            display_fils = $(this).closest(".fils_attrib").css("display")
        }

        if (display_fils != "none") {
            var hasQte = $(this).attr('hasQte')

            if (hasQte > 0) {

                qty = $(this).parents(".SelectInfobia").find("input[type=number]").val()

            }

            if ($(this).val() > 0) {
                priceselect = parseFloat(priceselect) + (parseFloat($(this).val()) * parseInt(qty))
            }
        }
    });
    //alert(priceselect)

    /************Radio*************/
    $("#divInfobia input[type='radio']:checked").each(function (index) {


        display_fils = "";
        if ($(this).closest(".fils_attrib").length > 0) {
            display_fils = $(this).closest(".fils_attrib").css("display")
        }

        if (display_fils != "none") {

            if ($(this).val() > 0) {

                var hasQte = $(this).attr('hasQte')
                if (hasQte == 1) {
                    typeAffiche = $(this).attr('typeAffiche');
                    if (typeAffiche == "withImg") {
                        qty = $(this).parents("label").parent().find("input[type='number']").val()
                    } else {
                        qty = $(this).parents(".divInfobiaRadio").find("input[type='number']").val()

                    }

                    priceradio = priceradio + (parseFloat($(this).val()) * parseInt(qty))

                } else {
                    priceradio = priceradio + parseFloat($(this).val())
                }


            }

        }


    });
    //   pricecheckbox_without_reduct=0;
    /************Checkbox*************/
    $("#divInfobia input[type='checkbox']:checked").each(function (index) {

        display_fils = "";

        if ($(this).parents(".fils_attrib").length > 0) {
            display_fils = $(this).parents(".fils_attrib").css("display")
        }

        if (display_fils != "none") {

            if ($(this).val() > 0) {
                hasQte = $(this).attr('hasQte')


                var qteAttrib = 1
                if (hasQte == 1) {
                    qteAttrib = parseInt($(this).parents(".infobiaCheckbox").find("input[type='number']").val(), 10)
                }
                if (isNaN(qteAttrib) || qteAttrib < 0) {
                    qteAttrib = 0
                }
                pricecheckbox = pricecheckbox + parseFloat($(this).val()) * qteAttrib


            }

        }


    });

    /************prix initial+ les prix des attributs *************/
    supPrice = eval(priceselect + priceradio + pricecheckbox); //+parseFloat(prixBase)
    prixFinal = (parseFloat(prixBase) + parseFloat(supPrice)).toFixed(price_round)


    if (reduction != "") {
        if (reduction_type == "percentage") {
            prixFinalRed = (eval(prixFinal * (1 - reduction))).toFixed(price_round)
        }
        if (reduction_type == "amount") {
            prixFinalRed = (eval(prixFinal - reduction)).toFixed(price_round)
        }

    } else {
        prixFinalRed = prixFinal
    }


    $("#priceInfobia").val(supPrice)

    if (reduction != "") {
        if ($(".product-discount").length == 0 && prixFinal > 0) {
            $(".product-prices").prepend("<div class='product-discount'><span class='regular-price'></span></div>");
        }

        $(".product-discount .regular-price").html(prixFinal + ' ' + currency_symbol);
    }
    $(".current-price span:eq(0)").html(prixFinalRed + ' ' + currency_symbol);


    //Footer Product
    if (prixFinal > 0 && reduction != "") {
        if ($(".divdiscountInfobia").length == 0) {
            $(".product-prices-infobia h3").append("<div class='product-discount divdiscountInfobia'><span class='regular-price'></span></div>");
        }
        $(".product-prices-infobia .product-discount .regular-price").html(prixFinal + ' ' + currency_symbol);

    }
    $(".product-prices-infobia .current-price span:eq(0)").html(prixFinalRed + ' ' + currency_symbol);


}


$(document).ready(function () {

    /* The server renders "reste" as the group's full allowance even when a
     * default is already ticked, so the first tick could take the group over
     * its own maximum. Settle every group against what is actually ticked. */
    $(".div_checkbox").each(function () {
        infobiaRecount($(this))
    });

    $('[data-toggle="popover"]').popover();
    $('select option:selected').each(function (index) {
        if ($(this).val() == -1) {
            $(this).parents('.SelectInfobia').find('.plusminusDiv').hide()
        }
    });

    $('.selectsimple').change(function () {
        var selectedOption = $(this).find(':selected').val();

        if (selectedOption == -1) {
            $(this).parents('.SelectInfobia').find('.plusminusDiv').hide()
        } else {
            $(this).parents('.SelectInfobia').find('.plusminusDiv').show()
        }
    });
    $("#save_easy, .save_easy").click(function () {

        saveInfobiaCustomization();

    });


    $("button[data-button-action='add-to-cart']").attr("type", "button")
    $("button[data-button-action='add-to-cart']").attr("class", "")
    $("button[data-button-action='add-to-cart']").addClass("btn btn-primary save_easy")
    $("button[data-button-action='add-to-cart']").attr("onclick", "saveInfobiaCustomization()")
    $("button[data-button-action='add-to-cart']").attr("data-button-action", "")
    $('#quantity_wanted').attr('name', "qtyInfobia")
    $('#quantity_wanted').attr('id', "qtyInfobia")


    resultPrice()
});

$("#closeBarBottom").click(function () {
    $(".product-prices-infobia").hide();
});


$(".qtyInfobiaButton").click(function () {
    typeInfobia = $(this).attr("typeInfobia")
    if (typeInfobia == "up") {
        $("#quantity_wanted_infobia").val(parseInt($("#quantity_wanted_infobia").val()) + 1)
        $("#qtyInfobiaf").val(parseInt($("#qtyInfobiaf").val()) + 1)
    } else {
        if ($("#quantity_wanted_infobia").val() > 1) {
            $("#quantity_wanted_infobia").val(parseInt($("#quantity_wanted_infobia").val()) - 1)
            $("#qtyInfobiaf").val(parseInt($("#qtyInfobiaf").val()) - 1)
        }

    }
    $("#qtyInfobiaf").val($("#quantity_wanted_infobia").val())

})


$(".quantity").change(function () {
    obj = $(this);
    updateQuantite(obj, "keyup");
});
$(".plusminus").click(function () {
    /*********change qty attrib************/


    updateQuantite($(this), "btnPlusminus")
    return -1

});


$("#divInfobia select").change(function () {

    id_group = $(this).attr('id_group');
    id_option = $(this).attr('id_option');
    min = $(this).find("option:selected").attr("minAttrib")
    max = $(this).find("option:selected").attr("maxAttrib")

    defaultNbAttrib = $(this).find("option:selected").attr("defaultNbAttrib")

    $(this).parents('.SelectInfobia').find('.plusminusDiv').attr("min_attr", min)
    $(this).parents('.SelectInfobia').find('.plusminusDiv').attr("max_attr", max)
    $(this).parents('.SelectInfobia').find('.plusminusDiv').attr("default_attr", defaultNbAttrib)
    $(this).parents('.SelectInfobia').find("input[type=number]").val(parseInt(defaultNbAttrib))

    $("#divChildren_" + id_group + "_" + id_option).find(".fils_attrib").hide()
    hasFils = $(this).find("option:selected").attr("hasFils");
    if (hasFils == "1") {
        id_attrib = $(this).find("option:selected").attr("id_attribut");
        $("#Children_" + id_group + "_" + id_option + "_" + id_attrib).show()
    }
    default_attr = $(this).attr("defaultNbAttrib")
    updateQuantite($(this))
    resultPrice();
});


//checkbox change
$('input[type=checkbox]').change(function () {

    typeAff = $(this).attr('typeAff')
    hasQte = $(this).attr('hasQte')


    hasFils = $(this).attr('hasFils')
    id_groupe = $(this).attr('id_groupe');
    id_option = $(this).attr('id_opt');
    id_att = $(this).attr('id_att');
    if ($(this).is(':checked')) {
        $(this).parents("label").find("p").css('color', color_text);
        $(this).parents("label").find(".infobiaCheckboxContent").css('background', background);

        if (hasQte == 1) {
            default_attr = $(this).parents(".infobiaCheckbox").find(".plusminusDiv").attr("default_attr")


            if (default_attr == "") {
                default_attr = 1
            }
            reste = $(this).parents(".div_checkbox").find("input[name='reste']").val()
            if (parseInt(reste) < parseInt(default_attr)) {
                min_attr = $(this).parent("div").find(".plusminusDiv").attr("min_attr")
                default_attr = min_attr
            }

            $(this).parents(".infobiaCheckbox").find("input[type='number']").val(default_attr)// for simple checkbox


        } else {

            $(this).parents(".infobiaCheckbox").find("input[type='number']").val(1)


        }

        obj = $(this).parents(".infobiaCheckbox").find("input[type='number']")


        obj = $(this).parents(".infobiaCheckbox").find("input[type='number']")


        updateQuantite(obj)
        if (hasFils == 1) {
            $("#Children_" + id_groupe + "_" + id_option + "_" + id_att).show();
        }


    } else {

        obj = $(this).parents(".infobiaCheckbox").find("input[type='number']")
        $(this).parents("label").find("p").css('color', 'black');
        $(this).parents("label").find(".infobiaCheckboxContent").css('background', 'none');
        if (hasQte == 1) {


            $(this).parents("label").parent().find("input[type='number']").val(0)
            // for simple checkbox
            $(this).parents(".infobiaCheckbox").find("input[type='number']").val(0)
            $(this).parents(".infobiaCheckbox").find(".plusminus").prop("disabled", false)
            $(this).parents(".infobiaCheckbox").find(".plusminus").css("opacity", 1)
            updateQuantite($(this))
        } else {

            $(this).parents(".infobiaCheckbox").find("input[type='number']").val(0)

            updateQuantite(obj)
        }


        if (hasFils == 1) {
            $("#Children_" + id_groupe + "_" + id_option + "_" + id_att).hide();
        }


    }

    infobiaRecount($(this).closest(".div_checkbox"))

});

$("input[type=radio]").change(function () {

    typeAffiche = $(this).attr("typeAffiche")
    hasQty = $(this).attr('hasqte');
    default_qte = $(this).attr('default_qte');
    if (default_qte == 0) {
        default_qte = 1
    }

    if (typeAffiche == "withImg") {
        $(this).parents(".RadioImgInfobia").find("p").css('color', 'black');
        $(this).parents(".RadioImgInfobia").find(".classRadioInfobia").css('background', 'none');
        $(this).parents('.RadioImgInfobia').find(".plusminus").prop('disabled', false);
        $(this).parents('.RadioImgInfobia').find(".plusminus").css('opacity', 1);

        $(this).parents("label").find("p").css('color', color_text);
        $(this).parents("label").find(".classRadioInfobia").css('background', background);


        $(this).parents(".RadioImgInfobia").find("input[type='number']").val(0);
        if (hasQty == 1) {
            $(this).parents("label").parent().find("input[type='number']").val(default_qte)
        }
    } else {
        $(this).parents('.RadioInfobia').find(".plusminus").prop('disabled', false);
        $(this).parents('.RadioInfobia').find(".plusminus").css('opacity', 1);

        $(this).parents(".RadioInfobia").find("input[type='number']").val(0);
        if (hasQty == 1) {

            $(this).parents(".divInfobiaRadio").find("input[type='number']").val(default_qte)

        }
    }

    id_groupe = $(this).attr('id_groupe');
    id_option = $(this).attr('id_opt');
    $("#divChildren_" + id_groupe + "_" + id_option + " .fils_attrib").hide();

    hasFils = $(this).attr('hasFils')
    if (hasFils == 1) {
        id_groupe = $(this).attr('id_groupe');
        id_option = $(this).attr('id_opt');
        id_att = $(this).attr('id_att');

        $("#Children_" + id_groupe + "_" + id_option + "_" + id_att).show();

    }
    resultPrice();


});

function fillStk(id_attr, qty, stok, name) {
    if (stk[id_attr]) {
        stk[id_attr][0] = eval(parseInt(stk[id_attr][0]) + parseInt(qty));
    } else {
        stk[id_attr] = Array(qty, stok, name)
    }
}

function getTicks() {
    var date = new Date();
    var ticks = date.getHours() + "" + date.getMinutes() + "" + date.getSeconds() + "" + date.getMilliseconds(); // fonction qui permet l'ajoute de date de jour pour  les  fichier images
    return ticks;
}

function makeJson(attr, value, prix, hasQte = 0) {
    label = '{"option":"' + attr + '","attribs":[' + value + '],"prix":"' + prix + '","hasQte":"' + hasQte + '"}';
    return label
}

function getSelect(obj) {
    label = ""
    val = $(obj).val();

    if (val != "-1") {
        id_attribut = $(obj).find('option:selected').attr("id_attribut")
        name = $(obj).find('option:selected').attr("name")
        paramname = $(obj).attr('paramname');
        qtySelect = 1
        hasQte = $(obj).find('option:selected').attr("hasQte")
        if (hasQte == 1) {
            qtySelect = $(obj).parents(".SelectInfobia").find("input[type=number]").val()
        }

        priceSelect = parseFloat($(obj).val()) * parseInt(qtySelect)
        value = '{"id":"' + id_attribut + '","value":"' + name + '","qty":"' + qtySelect + '"}'
        label = makeJson(paramname, value, priceSelect, hasQte)

        hasStock = $(this).attr('hasStock');

        if (hasStock == 1) {

            stock = $(this).attr('stock');


            fillStk(id_attribut, qtySelect, stock, name)
        }
    }
    return label
}

function getCheckBox(obj) {
    label = "";
    text_check = "";
    paramname = $(obj).attr('paramname');

    name = $(obj).attr("name");

    prix_check = 0;
    $("input[name=" + name + "]:checked").each(function (index) {

        if (text_check != "") text_check = text_check + " , "
        msgQty = "";
        paramname = $(this).attr('paramname');
        hasQte = $(this).attr('hasQte');
        id_opt = $(this).attr("id_opt");
        id_groupe = $(this).attr("id_groupe");
        id_attrib = $(this).attr("id_att")
        groupename = $(this).attr('groupename')

        qtyCheckbox = 1
        if (hasQte == 1) {
            qtyCheckbox = $(this).parents(".infobiaCheckbox").find("input[type=number]").val()

            hasStock = $(this).attr('hasStock');
            if (hasStock == 1) {
                stock = $(this).attr('stock');
                fillStk(id_attrib, qtyCheckbox, stock, $(this).attr('attrib_name'))
            }

        }
        value = '{"id":"' + id_attrib + '","value":"' + $(this).attr('attrib_name') + '","qty":"' + qtyCheckbox + '"}'
        text_check = text_check + value
        prix_check = prix_check + parseFloat($(this).val()) * parseInt(qtyCheckbox)
        if (text_check != "") {
            label = makeJson(paramname, text_check, prix_check, hasQte)
        }

    });


    return label
}


function getRadio(obj) {
    label = "";
    text_check = "";

    name = $(obj).attr("name");
    $("input[name=" + name + "]:checked").each(function (index) {


        paramname = $(this).attr('paramname');

        hasQte = $(this).attr('hasQte');

        msgQty = "";
        qtyRadio = 1
        id_attrib = $(this).attr("id_att")
        id_opt = $(this).attr("id_opt");
        id_groupe = $(this).attr("id_groupe");
        if (hasQte == 1) {
            qtyRadio = $(this).parents(".divInfobiaRadio").find("input[type=number]").val()
            hasStock = $(this).attr('hasStock');

            if (hasStock == 1) {

                stock = $(this).attr('stock');

                fillStk(id_attrib, qtyRadio, stock, $(this).attr('attrib_name'))

            }

        }

        priceRadio = parseFloat($(this).val()) * parseInt(qtyRadio)
        value = '{"id":"' + id_attrib + '","value":"' + $(this).attr('attrib_name') + '","qty":"' + qtyRadio + '"}'
        label = makeJson(paramname, value, priceRadio, hasQte)

    });
    return label
}

function getText(obj) {
    label = ""

    if ($(obj).val() != "") {
        paramname = $(obj).attr('paramname');
        val = $(obj).val()
        value = '{"id":"' + 0 + '","value":"' + val + '","qty":"' + 1 + '"}'
        label = makeJson(paramname, value, 0)

    }

    return label

}

function getEntier(obj) {


    label = ""
    display_fils = "";
    if ($(obj).parents(".fils_attrib").length > 0) {
        display_fils = $(obj).parents(".fils_attrib").css("display")
    }


    if (display_fils != "none") {
        if ($(obj).val() != "") {
            paramname = $(obj).attr('paramname');
            val = $(obj).val()
            value = '{"id":"' + 0 + '","value":"' + val + '","qty":"' + 1 + '"}'
            label = paramname + ":" + val;
            label = makeJson(paramname, value, 0)
        }
    }

    return label

}

function saveInfobiaCustomization() {
    stk = Array()
    $("#const").html('')
    labelInfobia = ""
    const arr_ids = [];
    msg = "";

    $('#divInfobia .groupInfobia').each(function (index) {

        nameGroup = "";
        labelGroup = "";

        $(this).find(".inputInfobia").each(function (index) {

            type = $(this).attr("type");
            name = $(this).attr("name");
            // alert(name)

            display_fils = "";
            if ($(this).parents(".fils_attrib").length > 0) {
                display_fils = $(this).parents(".fils_attrib").css("display")
            }


            if ($.inArray(name, arr_ids) == -1 && display_fils != "none") {
                arr_ids.push(name);

                if (type == "select") {
                    label = getSelect(this);
                }


                if (type == "checkbox") {
                    label = getCheckBox(this);
                }


                if (type == "radio") {

                    label = getRadio(this);

                }

                if (type == "text") {
                    label = getText(this);
                }

                if (type == "number") {
                    label = getEntier(this);
                }

                if (label != "") {
                    if (labelGroup != "") labelGroup = labelGroup + ", "
                    labelGroup = labelGroup + " " + label;
                }


            }


        });


        if (labelGroup != "") {
            if (labelInfobia != "") labelInfobia = labelInfobia + ","

            if (nameGroup != "") {
                labelInfobia = labelInfobia + " " + nameGroup + ": - " + labelGroup;
            } else {
                labelInfobia = labelInfobia + labelGroup;
            }
        }


    });


    error = 0
    stk.forEach(function (elm) {
        if (parseInt(elm[0]) > parseInt(elm[1])) {
            msg += "Nie ma wystarczająco  " + elm[2] + " w magazynie :( <br>"
        }
    });



    if (msg != "") {
        alertInfobia(msg, 8000)
        error = 1
    }


    if (labelInfobia != "") labelInfobia = "[" + labelInfobia + "]";

    id_customization = 0;
    if (labelInfobia != "") {
        id_customization = getTicks();
    }

    qty_product = parseInt($('#quantity_wanted_infobia').val())
    if (qty_product == "undefined" || isNaN(qty_product) == true) {
        qty_product = $('#qte_product_home').val()
    }

    if (checkQty() && error != 1) {
        $.ajax({
            url: $("#add-to-cart-or-refresh").attr('action'), // Le nom du fichier indiqué dans le formulaire
            type: $("#add-to-cart-or-refresh").attr('method'), // La méthode indiquée dans le formulaire (get ou post)
            data: $("#add-to-cart-or-refresh").serialize() + '&action=update&add=1&priceInfobia=' + $("#priceInfobia").val() + '&labelInfobia=' + labelInfobia + '&id_customization=' + id_customization + '&qty=' + qty_product, // action=add-to-cart Je sérialise les données (j'envoie toutes les valeurs présentes dans le formulaire)
            dataType: 'json',
            success: function (html) { // Je récupère la réponse du fichier PHP

                window.parent.document.location.href = "index.php?controller=cart&action=show"; // A corriger -> dynamique
            },
            error: function (error) {
                console.log(error)
            }
        });
    }

}


 