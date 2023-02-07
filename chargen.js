_.mixin(_.str.exports());

$(document).ready(function() {

    // 쿼리 문자열 매개 변수 가져오기
    var params = jHash.val();
    var zPosition = 0;

    // 해시(URL) 변경 이벤트, 해석 및 다시 그리기
    jHash.change(function() {
        params = jHash.val();
        interpretParams();
        redraw();
    });

    // 매개 변수를 설정하고 라디오 버튼이나 확인란을 클릭하면 다시 그립니다.
    $("input[type=radio], input[type=checkbox]").each(function() {
        $(this).click(function() {
            setParams();
            redraw();
        });
    });

    // 라디오 버튼이 선택 해제되어 있으면 그 자식도 선택 해제되어 있어야 합니다.
    $("input[type=radio]").each(function() {
        $(this).change(function() {
            var name = $(this).attr("name");
            // 안타깝게도 설정 시간 초과를 사용해야 합니다.
            window.setTimeout(function() {
                $("li>span>input[name=" + name + "]").each(function() {
                    if (!($(this).prop("checked"))) {
                        var $this = $(this).parent();
                        $this.removeClass("expanded").addClass("condensed");
                        $this = $this.parent();
                        var $ul = $this.children("ul");
                        $ul.hide('slow');
                        $ul.find("input[type=checkbox]").each(function() {
                            $(this).prop("checked", false);
                        });
                    }
                });
                redraw();
            }, 0);
        });
    });

    // 어린이를 클릭할 때 다중 토글하지 않기
    $("#chooser>ul>li>ul>li>ul>li").click(function(event) {
        event.stopPropagation();
    });

    // 클릭 시 목록 요소 자식 표시 토글
    // 레이블에 한 번, 입력에 한 번 두 번 토글하지 마세요.
    // 다시 말하지만, 자식을 클릭할 때 여러 번 토글하지 마세요.
    $("#chooser>ul>li>ul>li").click(function(event) {
        if (!($(event.target).get(0).tagName == "LABEL")) {
            $(this).children("span").toggleClass("condensed").toggleClass("expanded");
            var $ul = $(this).children("ul");
            $ul.toggle('slow').promise().done(drawPreviews);
        }
        event.stopPropagation();
    });

    // 클릭 시 목록 요소 자식 표시 토글
    // 다시 말하지만, 자식을 클릭할 때 다중 토글하지 마십시오.
    $("#chooser>ul>li").click(function(event) {
        $(this).children("span").toggleClass("condensed").toggleClass("expanded");
        var $ul = $(this).children("ul");
        $ul.toggle('slow').promise().done(drawPreviews);
        event.stopPropagation();
    });

    // 모두 접기 링크를 클릭할 때 #chooser의 모든 uls를 접습니다.
    $("#collapse").click(function() {
        $("#chooser>ul ul").hide('slow');
        $("#chooser>ul span.expanded").removeClass("expanded").addClass("condensed");
    });

    var canvas = $("#spritesheet").get(0);
    var ctx = canvas.getContext("2d");

    const maxColors = 200;

    $("#previewFile").change(function() {
        previewFile();
    });

    $("#ZPOS").change(function() {
        previewFile();
    });

    function previewFile(){
        var preview = document.querySelector('img'); //이미지라는 이름의 쿼리를 선택합니다.
        var file    = document.querySelector('input[type=file]').files[0]; //sames as here

        var img = new Image;
        img.onload = function() {
            images["uploaded"] = img;
            redraw();
        }
        img.src = URL.createObjectURL(file);
    }

    function renameImageDownload(link, canvasItem, filename) {
        link.href = canvasItem.toDataURL();
        link.download = filename;
    };

    //png파일로 저장합니다.
    $("#saveAsPNG").click(function() {
        renameImageDownload(this, canvas, 'Download' + Math.floor(Math.random() * 100000) + '.png');
    });

    $("#resetAll").click(function() {
        window.setTimeout(function() {
            document.getElementById("previewFile").value = "";
            images["uploaded"] = null;
            document.getElementById("RGB-R").value = 0;
            document.getElementById("RGB-G").value = 0;
            document.getElementById("RGB-B").value = 0;
            document.getElementById("ZPOS").value = 0;
            params = {};
            jHash.val(params);
            redraw();
        }, 0, false);
    });

    // 캔버스에서 색상 가져오기
    $("#changeColors").click(function() {
      const colorsFound = [];
      var imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
      
      const rChange = parseInt(document.getElementById("RGB-R").value) || 0;
      const gChange = parseInt(document.getElementById("RGB-G").value) || 0;
      const bChange = parseInt(document.getElementById("RGB-B").value) || 0;

      if (rChange === 0 && gChange === 0 && bChange === 0) {
        document.getElementById("colorsChanged").value = "No input for RGB change";
        return;
      }
      // 최대 색상을 200으로 설정
      for (var i=0;i<imgData.data.length;i+=4) {
        let r = imgData.data[i];
        let g = imgData.data[i+1];
        let b = imgData.data[i+2];
        let a = imgData.data[i+3];
        let rgb = r + "|" + g + "|" + b;
        if (a === 255 && !colorsFound.includes(rgb) && rgb !== "0|0|0") {
          colorsFound.push(rgb);
          if (colorsFound.length > maxColors) {
          	break;
          }
        }
      }
      document.getElementById("colorsChanged").value = "Colors detected: " + colorsFound.length;

      // 색상 바꾸기
      for (var i=0;i<imgData.data.length;i+=4) {
        let r = imgData.data[i];
        let g = imgData.data[i+1];
        let b = imgData.data[i+2];
        let rgb = r + "|" + g + "|" + b;

        for (var j=0;j<colorsFound.length;j+=1) {
            if (colorsFound[j] === rgb) {
             imgData.data[i] = r+rChange;
             imgData.data[i+1] = g+gChange;
             imgData.data[i+2] = b+bChange;
            }
        }
      }
      ctx.putImageData(imgData,0,0);

      // 찾은 색상 그리기
      for (var i=0;i<colorsFound.length;i+=1) {
        var colors = colorsFound[i].split("|");
        ctx.beginPath();
        ctx.rect(8 * 64 + i*20, 20, 20, 20);
        ctx.fillStyle = "rgb("+colors[0]+", "+colors[1]+", "+ colors[2]+")";
        ctx.fill();
      }
    });

    // 오버사이즈 요소가 사용되었는지 확인
    var oversize = $("input[type=radio]").filter(function() {
        return $(this).data("oversize");
    }).length > 0;

    // 오버사이즈 요소를 사용한 경우 캔버스 확장
    if (oversize) {
        canvas.width = 1152; // 1536 ->  1152로 변경 (24개)
        canvas.height = 1344 + 768; // 33개
    } else {
        canvas.width = 624; //832 -> 624
        canvas.height = 1344; // 13개
    }
    $("#chooser>ul").css("height", canvas.height);

    // 다시 그릴 때마다 호출됩니다.
    function redraw() {
        const zposPreview = parseInt(document.getElementById("ZPOS").value) || 0;
        let didDrawPreview = false;
        zPosition = 0;
        // 다시 시작
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 오버사이즈 요소가 사용되고 있는지 확인합니다.
        oversize = $("input[type=radio]:checked").filter(function() {
            return $(this).data("oversize");
        }).length > 0;

        // 오버사이즈 요소가 사용 중이면 캔버스를 확장합니다,
        // 그렇지 않으면 일반 크기로 반환합니다.
        if (oversize) {
            canvas.width = 1152;
            canvas.height = 1344 + 768;
        } else {
            canvas.width = 624;
            canvas.height = 1344;
        }
        $("#chooser>ul").css("height", canvas.height);
        oversize = !!oversize;

        // 크기가 크지 않은 요소
        $("input[type=radio]:checked, input[type=checkbox]:checked").filter(function() {
            return !$(this).data("oversize");
        }).each(function(index) {
            if (zposPreview == zPosition) {
                if (!didDrawPreview) {
                    drawPreview();
                    didDrawPreview = true;
                }
            }
            // 이 내용을 닫기에 저장
            var $this = $(this);

            // 남성 또는 여성 선택 여부 확인
            var isMale = $("#sex-male").prop("checked");
            var isFemale = $("#sex-female").prop("checked");

            // 데이터 파일이 지정된 경우
            if ($(this).data("file")) {
                var img = getImage($(this).data("file"));

                // 데이터-비하인드가 지정된 경우 기존 픽셀 뒤에 그리기
                if ($(this).data("behind")) {
                    ctx.globalCompositeOperation = "destination-over";
                    drawImage(ctx, img);
                    ctx.globalCompositeOperation = "source-over";
                } else
                drawImage(ctx, img);
            }

            // 데이터-파일_배경이 지정된 경우
            if ($(this).data("file_behind")) {
                var img = getImage($(this).data("file_behind"));
                ctx.globalCompositeOperation = "destination-over";
                drawImage(ctx, img);
                ctx.globalCompositeOperation = "source-over";
            }

            // 방패/체인 모자 겹침 문제 해결
            if ($(this).data("file_hat") && $("#hat_chain").prop("checked")) {
                var img = getImage($(this).data("file_hat"));
                drawImage(ctx, img);
            }
            if ($(this).data("file_no_hat") && !$("#hat_chain").prop("checked")) {
                var img = getImage($(this).data("file_no_hat"));
                drawImage(ctx, img);
            }

            // 데이터 파일_남성 및 데이터 파일_여성이 지정된 경우
            if (isMale && $(this).data("file_male")) {
                var img = getImage($(this).data("file_male"));
                drawImage(ctx, img);
            }
            if (isFemale && $(this).data("file_female")) {
                var img = getImage($(this).data("file_female"));
                drawImage(ctx, img);
            }

            // 데이터 파일_남성_라이트... 및 데이터 파일_여성_라이트...가 지정된 경우
            var bodytypes = ["none", "light", "dark", "dark2", "tanned", "tanned2", "darkelf", "darkelf2", "reptbluewings", "reptbluenowings", "reptredwings", "reptdarkwings", "reptdarknowings", "white", "peach", "brown", "olive", "black"];
            if (isMale) {
                _.each(bodytypes, function(bodytype) {
                    if ($("#body-" + bodytype).prop("checked") && $this.data("file_male_" + bodytype)) {
                        var img = getImage($this.data("file_male_" + bodytype));
                        drawImage(ctx, img);
                    }
                });
            }
            if (isFemale) {
                _.each(bodytypes, function(bodytype) {
                    if ($("#body-" + bodytype).prop("checked") && $this.data("file_female_" + bodytype)) {
                        var img = getImage($this.data("file_female_" + bodytype));
                        drawImage(ctx, img);
                    }
                });
            }

            // 일반 또는 포니테일2 헤어 스타일에 적합한 그림자 그리기체색에 적합한 헤어 스타일
            var id = $(this).attr("id");
            if (_.startsWith(id, "hair-")) {
                var style = id.substring(5, id.indexOf("-", 5));
                $("input[type=radio]:checked").filter(function() {
                    return $(this).attr("id").substr(0, 5) == "body-";
                }).each(function() {
                    var hsMale = "hs_" + style + "_male";
                    var hsFemale = "hs_" + style + "_female";
                    if (isMale && $(this).data(hsMale)) {
                        var img = getImage($(this).data(hsMale))
                        drawImage(ctx, img);
                    }
                    if (isFemale && $(this).data(hsFemale)) {
                        var img = getImage($(this).data(hsFemale))
                        drawImage(ctx, img);
                    }
                });
            }
        });

        if (!didDrawPreview) { // z포지션이 높거나 낮음, 어쨌든 모든 것을 그립니다.
            drawPreview();
            didDrawPreview = true;
        }

        // 대형 무기: 기존 캔버스 포즈를 새 위치로 복사
        // 64x64가 아닌 192x192 패딩 포함 -> 48x64, 144x192
        // data-oversize="1"은 추력 무기를 의미합니다.
        // 데이터 오버사이즈="2"는 슬래시 무기를 의미합니다.
        // 적절한 추력 또는 슬래시 포즈 사용
        if (oversize) {
            $("input[type=radio]:checked").filter(function() {
                return $(this).data("oversize");
            }).each(function(index) {
                var type = $(this).data("oversize");
                if (type == 1) {
                    for (var i = 0; i < 8; ++i)
                        for (var j = 0; j < 4; ++j) {
                            var imgData = ctx.getImageData(48 * i, 256 + 64 * j, 48, 64);
                            ctx.putImageData(imgData, 64 + 192 * i, 1408 + 192 * j);
                            var imgData = ctx.getImageData(48 * i, 256 + 64 * j, 48, 64);
                            ctx.putImageData(imgData, 48 + 192 * i, 1408 + 192 * j);
                        }
                        if ($("#sex-male").prop("checked") && $(this).data("file_male")) {
                            var img = getImage($(this).data("file_male"));
                            ctx.drawImage(img, 0, 1344);
                        }else if ($("#sex-female").prop("checked") && $(this).data("file_female")) {
                            var img = getImage($(this).data("file_female"));
                            ctx.drawImage(img, 0, 1344);
                        }else if ($(this).data("file")) {
                            var img = getImage($(this).data("file"));
                            ctx.drawImage(img, 0, 1344);
                        }
                    } else if (type == 2) {
                        for (var i = 0; i < 6; ++i)
                            for (var j = 0; j < 4; ++j) {
                                var imgData = ctx.getImageData(48 * i, 768 + 64 * j, 48, 64);
                                ctx.putImageData(imgData, 64 + 192 * i, 1408 + 192 * j);
                                var imgData = ctx.getImageData(48 * i, 768 + 64 * j, 64, 64);
                                ctx.putImageData(imgData, 48 + 192 * i, 1408 + 192 * j);
                            }
                            if ($("#sex-male").prop("checked") && $(this).data("file_male")) {
                                var img = getImage($(this).data("file_male"));
                                ctx.drawImage(img, 0, 1344);
                            }
                            if ($("#sex-female").prop("checked") && $(this).data("file_female")) {
                                var img = getImage($(this).data("file_female"));
                                ctx.drawImage(img, 0, 1344);
                            }
                        }
                    });
        }

        // 불법 조합이 사용된 경우 모두 지웁니다.
        // 아마 이것을 방지해야 할 것입니다.
        $("input[type=radio], input[type=checkbox]").each(function(index) {
            if ($(this).data("required")) {
                var requirements = $(this).data("required").split(",");
                var passed = true;
                _.each(requirements, function(req) {
                    var requirement = req.replace("=", "-");
                    if (!$("#" + requirement).prop("checked"))
                        passed = false;
                });
                if (passed)
                    $(this).prop("disabled", false);
                else {
                    $(this).prop("disabled", true);
                    if ($(this).prop("checked"))
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
            if ($(this).data("prohibited")) {
                var requirements = $(this).data("prohibited").split(",");
                var passed = true;
                _.each(requirements, function(req) {
                    var requirement = req.replace("=", "-");
                    if ($("#" + requirement).prop("checked"))
                        passed = false;
                });
                if (passed)
                    $(this).prop("disabled", false);
                else {
                    $(this).prop("disabled", true);
                    if ($(this).prop("checked"))
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
        });
    }

    function drawPreview() {
        if (images["uploaded"] != null) {
            drawImage(ctx, images["uploaded"]);
        }
    }

    // 매개변수에 따라 확인란 변경
    function interpretParams() {
        $("input[type=radio]").each(function() {
            var words = _.words($(this).attr('id'), '-');
            var initial = _.initial(words).join('-');
            $(this).prop("checked", $(this).attr("checked") || params[initial] == _.last(words));
        });
        $("input[type=checkbox]").each(function() {
            $(this).prop("checked", _.toBool(params[$(this).attr('id')]));
        });
    }

    // 라디오 버튼 또는 확인란 클릭에 대한 응답으로 매개변수 설정
    function setParams() {
        $("input[type=radio]:checked").each(function() {
            var words = _.words($(this).attr('id'), '-');
            var initial = _.initial(words).join('-');
            if (!$(this).attr("checked") || params[initial]) {
                params[initial] = _.last(words);
            }
        });
        $("input[type=checkbox]").each(function() {
            if (_.toBool($(this).attr("checked")) != $(this).prop("checked") ||
                _.toBool(params[$(this).attr('id')]) != $(this).prop("checked"))
                params[$(this).attr('id')] = $(this).prop("checked") ? 1 : 0;
        });
        jHash.val(params);
    }

    // 이미지 캐시
    var images = {};

    function getImage(imgRef) {
        if (images[imgRef])
            return images[imgRef];
        else {

            // 캐시에 없는 경우 이미지 로드
            var img = new Image();
            img.src = "spritesheets/" + imgRef;
            img.onload = redraw;
            images[imgRef] = img;
            return img;
        }
    }

    function getImage2(imgRef, callback) {
        if (images[imgRef]) {
            callback(images[imgRef]);
            return images[imgRef];
        } else {

            // 캐시에 없는 경우 이미지 로드
            var img = new Image();
            img.src = "spritesheets/" + imgRef;
            img.onload = function() { callback(img) };
            images[imgRef] = img;
            return img;
        }
    }

    // 이미지를 사용할 수 없는 경우 모든 자바스크립트 실행을 중지하지 않습니다.
    function drawImage(ctx, img) {
        try {
            ctx.drawImage(img, 0, 0);
            zPosition++;
        } catch(err) {
            console.error("Error: could not find " + img.src);
        }
    }

    // 그리기 - 준비 완료
    interpretParams();
    if (Object.keys(params).length == 0) {
        $("input[type=reset]").click();
        setParams();
    }
    redraw();

    // 프리뷰 이미지 그리기
    function drawPreviews() {
        this.find("input[type=radio], input[type=checkbox]").filter(function() {
            return $(this).is(":visible");
        }).each(function() {
            if (!$(this).parent().hasClass("hasPreview")) {
                var prev = document.createElement("canvas");
                var oversize = $(this).data("oversize");
                prev.setAttribute("width", 48);
                prev.setAttribute("height", 64);
                var prevctx = prev.getContext("2d");
                var img = null;
                var previewRow = $(this).data("preview_row");
                if (!previewRow)
                    previewRow = 10;
                else
                    previewRow = parseInt(previewRow);
                var callback = function(img) {
                    try {
                        if (oversize)
                            prevctx.drawImage(img, 0, 2 * 192, 192, 192, 0, 0, 48, 64);
                        else
                            prevctx.drawImage(img, 0, previewRow * 48, 64, 48, 0, 0, 48, 64);
                    } catch (err) {
                        console.log(err);
                    }
                };
                if ($(this).data("file"))
                    img = getImage2($(this).data("file"), callback);
                else if ($(this).data("file_male"))
                    img = getImage2($(this).data("file_male"), callback);
                else if ($(this).data("file_female"))
                    img = getImage2($(this).data("file_female"), callback);
                else if ($(this).data("file_male_light"))
                    img = getImage2($(this).data("file_male_light"), callback);
                else if ($(this).data("file_no_hat"))
                    img = getImage2($(this).data("file_no_hat"), callback);
                if (img != null) {
                    this.parentNode.insertBefore(prev, this);
                    $(this).parent().addClass("hasPreview").parent().addClass("hasPreview");
                }
            }
        });
    };

    // 프리뷰 애니메이션
    var oversize = $(this).data("oversize");
    var anim = $("#previewAnimations").get(0);
    var animCtx = anim.getContext("2d");
    var $selectedAnim = $("#whichAnim>:selected");
    var animRowStart = parseInt($selectedAnim.data("row"));
    var animRowNum = parseInt($selectedAnim.data("num"));
    var animRowFrames = parseInt($selectedAnim.data("cycle"));
    var currentFrame = 0;

    $("#whichAnim").change(function() {
        $selectedAnim = $("#whichAnim>:selected");
        animRowStart = parseInt($selectedAnim.data("row"));
        animRowNum = parseInt($selectedAnim.data("num"));
        animRowFrames = parseInt($selectedAnim.data("cycle"));
        currentFrame = 0;
    });

    function nextFrame() {
        currentFrame = (currentFrame + 1) % animRowFrames;
        animCtx.clearRect(0, 0, anim.width, anim.height);
        for (var i = 0; i < animRowNum; ++i) {
            if (oversize && animRowStart === 4) {
                animCtx.drawImage(canvas, currentFrame * 192, (animRowStart + 5) * 192, 192, 192, i * 192, 0, 192, 192);
                break;
            } else if (oversize && animRowStart === 12) {
                animCtx.drawImage(canvas, currentFrame * 192, (animRowStart - 3) * 192, 192, 192, i * 192, 0, 192, 192);
                break;
            } else {
                animCtx.drawImage(canvas, currentFrame * 48, (animRowStart + i) * 64, 64, 48, i * 64, 0, 48, 64);
                animCtx.drawImage(canvas, currentFrame * 48, (animRowStart + i) * 64, 64, 64, i * 64, 0, 48, 64);
            }
            
        }
        setTimeout(nextFrame, 156);
    }
    nextFrame();
});
