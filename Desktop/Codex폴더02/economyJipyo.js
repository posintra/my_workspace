//지표 관련 변수
var vRegionArr = new Array()
  , vDetailDataArr = new Array()
  , vPrdDeList = new Array()
  , vSourceList = new Array()
  , vDetailChartColors = ['#F9BF9A', '#F7A956', '#E184A6', '#C63B76', '#77A0D3', '#2B4F8F', '#70C6B3', '#409B9F', '#B8BC74', '#C59559', '#93764E']
  , nationwideYn = false  //전국 선택했는지 안했는지.
  , vCyclSe			
  , vCyclNm 
  , vBaseSetting = true //초기셋팅
  , vPreOther
  , vPrePeriod
  , vSpclBefore
  , vSpclIncrease
  , vTableData = new Array(); //통계표 다운로드를 위한 List
//amChart 관련 변수
var vDetailRoot
  , vDetailChart
  , vDetailSeries
  , xAxis
  , yAxis
  , vDetailLegend
  , vNoData = false;

$(document).ready(function(){
	
	fnMapToBtnSetting(); //지도를 버튼으로 동적 생성
	fnAmChartBaseSetting();
	fnSelectOtherSetting();
	fnSelectIncreaseSetting();
	
	$('.Btn_Stat').trigger('click'); //통계표 열려있도록 기본 셋팅
	
});

//InfoBox 열기
$(document).on("click", ".InfoBox .BtnOpen", function () {
	$( this ).parent(".InfoBox").addClass( "Open" );
});
//InfoBox 닫기
$(document).on("click", ".InfoBox .BtnClose", function () {
	$( this ).parent(".InfoBox").removeClass( "Open" );
});
//이용방법 
$(document).on("click", ".BtnManual", function () {
	$(this).toggleClass('Rewind');
	
	if($(this).hasClass('Rewind')){ //이용방법 오픈
		
		let menualVal = "";
		$('.ChartHeader>div[class*=Select]:not(.Hidden)').each(function(i){
			if(menualVal.length != 0){ menualVal+= ', ' }
			
			menualVal += $(this).attr('data-nm');
			
			if($('.ChartHeader>div[class*=Select]:not(.Hidden)').length -1 == i){
				if(lang != 'en'){
					if($(this).hasClass('SelectIncrease')){
						menualVal += '을'
					}else{
						menualVal += '를'
					}
				}
				$('.ChartHeader').attr("value", msg_menualVal.replace( '##', menualVal ));
			}
		});
		
		if($('.ChartHeader>div[class*=Select]:not(.Hidden)').length == 0){
			$('.ChartHeader').addClass('Hidden');
		}
		
		$('.Wrap').addClass('Manual_0101');
		
	}else{ //이용방법 해제
		$('.ChartHeader').removeClass('Hidden');
		$('.Wrap').removeClass('Manual_0101');
	}
});

//전국지도에서 지역 선택
$(document).on("click", ".MapArea [id^='Map_A_']", function () {
	
	if(!$(this).hasClass('Act')){
		return false;
	}
	
	var mapId = $(this).attr('id').replace('Map_A_', '');
	var regionCd = $(this).attr('data-regioncd');
	
	if($('.AreaType button.This').hasClass('BtnRegion') && $(this).parents('.Map_00').length){ //시군구에서 시도 클릭했을 때
		$('.MapArea>.This').removeClass('This');
		$('.MapArea .Map_' + mapId).addClass('This');
		
		if($(this).attr('data-regioncd') != '00'){
			$('.MapArea .BtnMapReset').removeClass('Hidden');
		}
		
		$('.BtnHeader .ListMap button[data-regioncd="'+$(this).attr('data-regioncd')+'"]').trigger('click');
		
		return false;
	}
	
	$(this).toggleClass('This');
	
	var regionCd = $(this).attr('data-regioncd');
	var clickCnt = 5; // 클릭할 수
	
	if($(this).hasClass('This')){//선택
		
		// 이미 5개 지역 선택 했다면 첫번째 선택 지역 제외하고
		if ( vRegionArr.length >= clickCnt  ) {
			
			var removeRegion;
			if(nationwideYn){
				removeRegion = vRegionArr[1];
				vRegionArr.splice(1, 1);
			}else{
				removeRegion = vRegionArr.shift();
			}
			
			$('.ContactRegion .List button.BtnDelete[data-regioncd="'+removeRegion.regionCd +'"]').parent().remove();
			$(".MapArea [id^='Map_A_'][data-regioncd='"+removeRegion.regionCd+"']").removeClass('This');
			$(".BtnArea [id^='Btn_A_'][data-regioncd='"+removeRegion.regionCd+"']").removeClass('This');
			
			
		}
		
		var regionNm = "";
		if($('.MapArea text[data-regioncd="'+regionCd+'"] tspan').length){
			regionNm = $('.MapArea text[data-regioncd="'+regionCd+'"] tspan').text();
		}else{
			regionNm = $('.MapArea text[data-regioncd="'+regionCd+'"]').text();
		}

		if(regionCd == '00'){
			$('.ContactRegion .List').prepend(' <span>'+regionNm+'<button class="BtnDelete" data-regioncd="'+regionCd+'">'+msg_del+'</button></span>');
			vRegionArr.unshift({
				regionCd	: regionCd
			});
			
			nationwideYn = true;
			
		}else{
			$('.ContactRegion .List').append(' <span>'+regionNm+'<button class="BtnDelete" data-regioncd="'+regionCd+'">'+msg_del+'</button></span>');
			vRegionArr.push({
				regionCd	: regionCd
			});
		}
		
		$('.BtnArea [id^="Btn_A_'+mapId+'"]').addClass('This');
		
	}else{ //선택취소
		for ( var i = 0 ; i < vRegionArr.length; i ++ ) {
			
			if ( vRegionArr[i].regionCd == regionCd ) {
				
				vRegionArr.splice(i, 1);
				
				$('.ContactRegion .List button.BtnDelete[data-regioncd="'+regionCd+'"]').parent().remove();
				$(".MapArea [id^='Map_A_'][data-regioncd='"+regionCd+"']").removeClass('This');
				
				if(regionCd == '00'){
					nationwideYn = false;
				}
				
				break;
				
			}
		}
		
		$('.BtnArea [id^="Btn_A_'+mapId+'"]').removeClass('This');
		
		
		if(vRegionArr.length == 0){
			$('.RegionSelectArea [id^="Map_A_"].Act').first().trigger('click');//지역 모두 빼버리면 첫번째꺼 클릭
		}
		
	}
	
	fnDetailDataSetting();
});

$(document).on('click', '.ContactRegion .List button.BtnDelete', function(){
	
	var regionCd = $(this).attr('data-regioncd');
	$(".MapArea [id^='Map_A_'][data-regioncd='"+regionCd+"']").trigger('click');
		
});

//레이어팝업 열기
$(document).on("click", ".BtnChangeIndex.BtnLayer", function () {
	$( this ).next( ".LayerPopup.jipyoChangePop" ).addClass( "Open" );
	$( "body" ).addClass( "noScroll" );
	
	$(".jipyoChangePop .StepBox .Box1>.CategoryList").eq(0).find("button").each( function () {
		if ( $('#listId').val() == $(this).attr('data-gubun') ) {
			$(this).addClass('This');
			$(this).trigger('click');
		} else {
			$(this).removeClass('This');
		}
	});
	
	$(".jipyoChangePop .StepBox .Box2>.IndexList").eq(0).find("li").each( function () {
		if($('#unitySrvcId').val() == $(this).find('input[name="index"]').val()){
			$(this).find('input[name="index"]').trigger('click');
		}
	});
	
});

//카테고리선택
$(document).on("click", ".jipyoChangePop .CategoryList button", function () {
	$( this ).siblings().removeClass( "This" );
	$( this ).addClass( "This" );
	var listId = $(this).attr('data-gubun');
	
	$('.StepBox>.Box2 h4 strong').text($(this).text());
	$('.StepBox>.Box2 i').attr('class', $(this).find('i').attr('class'));
	$(".StepBox .Box2>.IndexList").eq(0).find("li").each( function () {
		if ( listId == $(this).find('input[name="index"]').attr("data-listid")) {
			$(this).removeClass('Hidden');
		} else {
			$(this).addClass('Hidden');
		}
	});
});

//지표 선택
$(document).on("change", ".Box2>.IndexList input[name='index']", function () {
	$('.ContBox>.ContArea>#ContactIndex').val($(".Box2>.IndexList input:checked").attr('data-stdidctnm'));
});

//지표 적용
$(document).on("click", ".jipyoChangePop>.ContBox .ContArea .BtnSubmit", function () {
	var regionCdArr = "";
	
	for ( var i = 0 ; i < vRegionArr.length ; i ++ ) {
		if ( i != 0 ) regionCdArr += ',';
		regionCdArr += vRegionArr[i].regionCd;
	}
	
	$('#paramForm #listId').val($(".jipyoChangePop .Box2>.IndexList input:checked").attr('data-listid'));
	$('#paramForm #unitySrvcId').val($(".jipyoChangePop .Box2>.IndexList input:checked").val());
	$('#paramForm #regionCdArr').val(regionCdArr);
	$("#paramForm").attr("action", context + "/economyBoard/economyJipyo.do?lang="+lang);
	$('#paramForm').attr('method', 'post');
	$('#paramForm').submit();
});

	
$(document).on('click', '.ContactIndex .List button.BtnDelete', function(){
	
	var unitySrvcId = $(this).attr('data-unitysrvcid');
	$('.IndexSelectArea ul li>button.BtnIndex').each(function(){
		if(unitySrvcId == $(this).attr('data-unitysrvcid')){
			$(this).trigger('click');
		}
	});
		
});

//특화정보 상위 선택 ex) 연령별, 성별
$(document).on("click", ".SelectOther .List>button", function () {
	
	if(!vBaseSetting){ //초기셋팅이 아니면
		if(!confirm(msg_reset)){
			return false;
		}
	}
	
	$('.SelectOther').find('.This').removeClass('This')
	$( this ).addClass( "This" );
	$( this ).nextAll( "div" ).addClass('Hidden');
	$( this ).prevAll( "div" ).addClass('Hidden');
	$( this ).next().addClass( "This" );
	$( this ).next().removeClass( "Hidden" );
	
	if(vBaseSetting){ //초기셋팅
		$( this ).next().find('button[data-clsfcd="'+vOwnerOtherCd+'"]').addClass('This');
		$('.SelectOther>.BtnOther').text($( this ).next().find('button[data-clsfcd="'+vOwnerOtherCd+'"]').text());
	}else{
		$( this ).next().find('button:first').addClass('This');
		$('.SelectOther>.BtnOther').text($( this ).next().find('button:first').text());
	}
	
	vClsfGroupCd = $(this).attr('data-clsfgroupcd');
	vClsfCd = $(this).next().find('button.This').attr('data-clsfcd');
	
	fnSourceSetting();
	fnSelectPeriodSetting();
	fnSelectMapSetting();
	
});


//특화정보선택 하위 선택 ex) 남, 여
$(document).on("click", ".SelectOther .List [class*=List] button", function () {
	$( this ).siblings().removeClass( "This" );
	$( this ).addClass( "This" );
	
	$('.SelectOther>.BtnOther').text($( this ).text());
	vClsfCd = $('.SelectOther [class*=List].This button.This').attr('data-clsfcd');
	fnDetailDataSetting();
});

//수록주기선택
$(document).on("click", ".SelectPeriod .List button", function () {
	$(this).siblings().removeClass( "This" );
	$(this).addClass('This');
	$('.SelectPeriod>.BtnPeriod').text($(this).text());
	vCyclSe = $(this).attr('data-cyclse');
	vCyclNm = $(this).text();
	
	fnDetailDataSetting();
});

//증감 증감률 선택
$(document).on("click", ".SelectIncrease .List button", function () {
	vSpclBefore = $(this).attr('data-before');
	vSpclIncrease = $(this).attr('data-increase');
	
	fnDetailDataSetting();
	
	if(!vNoData){
		if(lang != 'en'){
			$('.ClearIncrease>.BtnIncrease').text($(this).text() + ' 해제');
		}else{
			$('.ClearIncrease>.BtnIncrease').text('Release of ' + $(this).text());
		}
		
		$('.SelectIncrease').addClass('Hidden');
		$('.ClearIncrease').removeClass('Hidden');
	}
	
});

//증감 증감률 해제
$(document).on("click", ".ClearIncrease button", function () {
	vSpclBefore = null;
	vSpclIncrease = null;
	
	$('.ClearIncrease>.BtnIncrease').text();
	
	$('.SelectIncrease').removeClass('Hidden');
	$('.ClearIncrease').addClass('Hidden');
	
	fnDetailDataSetting();
});

// 하위차트 > 수치 보기/숨기기 버튼 클릭
$(document).on("click", ".ViewDec", function() {

	var flag = $(this).hasClass('on');
	
	if ( flag ) {
		// 수치 세팅
		for ( var i = 0 ; i < vDetailChart.series.length ; i ++ ) {
			vDetailChart.series.getIndex(i).bullets.push(function(){
				return am5.Bullet.new(vDetailRoot, {
					locationY: 1,
					sprite: am5.Label.new(vDetailRoot, {
						centerX: am5.p50,
						centerY: am5.p100,
						fontSize: '12px',
						text: "{labelVal}",
						populateText: true
					})
				});
			});
		}
		
	} else {
		
		// 수치 세팅
		for ( var i = 0 ; i < vDetailChart.series.length ; i ++ ) {
			vDetailChart.series.getIndex(i).bullets.clear();

			if(vDetailChart.series.getIndex(i).get("spikes") == 0){
				vDetailChart.series.getIndex(i).bullets.push(function(vDetailRoot,vDetailSeries){
					return am5.Bullet.new(vDetailRoot, {
						sprite: am5.Circle.new(vDetailRoot, {
							radius: 5,
							fill: vDetailRoot.interfaceColors.get("background"),
							strokeWidth: 2,
							stroke: vDetailSeries.get("fill")
						})
					});
				})
			}else{
				
				vDetailChart.series.getIndex(i).bullets.push(function(vDetailRoot,vDetailSeries){
					return am5.Bullet.new(vDetailRoot, {
						sprite: am5.Star.new(vDetailRoot, {
							spikes: vDetailSeries.get("spikes") + 2,
							scale : 0.7,
							fill: vDetailRoot.interfaceColors.get("background"),
							strokeWidth: 2,
							stroke: vDetailSeries.get("fill")
						})
					});
				})				
			}
		}
		
	}
});


function fnAmChartBaseSetting(){
	
	vDetailRoot = am5.Root.new("chartDiv");
	
	vDetailRoot.setThemes([ am5themes_Animated.new( vDetailRoot ) ]);
	
	vDetailChart = vDetailRoot.container.children.push( am5xy.XYChart.new( vDetailRoot, {
		panX: true,
		panY: false,
		wheelX: "none",
		wheelY: "zoomX",
		layout: vDetailRoot.verticalLayout
	}));
	
	// 줌아웃 버튼 세팅
	vDetailChart.zoomOutButton.set("forceHidden", true);
	
	const cursor = vDetailChart.set("cursor", am5xy.XYCursor.new(vDetailRoot, {
		behavior: "none"
	}));
	cursor.lineX.set("visible", false);
	cursor.lineY.set("visible", false);
	
	// x축 세팅
	const xRenderer = am5xy.AxisRendererX.new(vDetailRoot, {
		minGridDistance: 50, // 0 : 모든 년도를 다 보여줌 -> 지정해야 좋지 않을까
		minPosition: 0.1,
		maxPosition: 0.9
	});
	xRenderer.grid.template.setAll({
		location: 0.5,
		strokeOpacity: 0
	});
	xRenderer.labels.template.setAll({
		location : 0.5,
		multiLocation : 0.5,
		paddingTop : 15,
		text : "{yearStr}"
	});

	xAxis = vDetailChart.xAxes.push(am5xy.CategoryAxis.new(vDetailRoot, {
		categoryField: "year",
	    renderer: xRenderer
	}));
	
	// y축 세팅
	const yRenderer = am5xy.AxisRendererY.new(vDetailRoot, {});
	
/*	yRenderer.labels.template.setAll({
		minPosition: 0.1 // 최소값 보일건지
	});*/
	yAxis = vDetailChart.yAxes.push(am5xy.ValueAxis.new(vDetailRoot, {
		extraMax: 0.1,
	    renderer: yRenderer
	}));
	
	vDetailChart.appear(1000, 100);
	
	const scrollbar = vDetailChart.set("scrollbarX", am5.Scrollbar.new(vDetailRoot, {
		orientation: "horizontal",
		// minWidth: 3,
		minHeight: 7
	}));
	// 스크롤바 크기 세팅
	scrollbar.startGrip.setAll({
		scale: 0.5
	});
	scrollbar.endGrip.setAll({
		scale: 0.5
	});
	
	vDetailChart.bottomAxesContainer.children.push(scrollbar);
	
}

function fnSelectOtherSetting(){ //분류셋팅
	
	$.ajax({
		type    : "POST",
		url     : context + "/economyBoard/selectOtherList.do?lang="+lang,
		async   : false,
		data    : { unitySrvcId : vUnitySrvcId },
		success : function(data) {
			
			var vOtherDataArr = data.otherList
			
			if ( vOtherDataArr != undefined && vOtherDataArr.length > 0 ) {
				var str = "";
				var prev = '';
				for(i = 0; i < vOtherDataArr.length; i++){
					if(prev != vOtherDataArr[i].clsfGroupCd){
						if(i != 0){
							str += '</div>';
						}
					    	str += '<button data-clsfgroupcd="'+vOtherDataArr[i].clsfGroupCd+'">'+vOtherDataArr[i].clsfGroupSrvcNm+'</button>';
					    	str += '<div class="ListAge">';
					}
						str += '		<button class="" data-clsfcd="'+vOtherDataArr[i].clsfCd+'">'+vOtherDataArr[i].clsfNm+'</button>';
					if(i == vOtherDataArr.length - 1){
							str += '</div>';
					}
					prev = vOtherDataArr[i].clsfGroupCd
				}
				
				$('.SelectOther div.List').html(str);
				
				$('.SelectOther div.List>button[data-clsfgroupcd="'+vOwnerOtherGroupCd+'"]').trigger('click');//대표분류그룹코드 클릭
				
			}else{
				$('.SelectOther').remove();
				fnSourceSetting();
				fnSelectPeriodSetting();
				fnSelectMapSetting();
			}
			
		}
	});
}

function fnSelectIncreaseSetting(){ //증감,증감률 셋팅

	$.ajax({
		type    : "POST",
		url     : context + "/economyBoard/selectIncreaseList.do?lang="+lang,
		async   : false,
		data    : { unitySrvcId : vUnitySrvcId, listId : vListId },
		success : function(data) {
			
			var vIncreaseDataArr = data.increaseList
			
			if ( vIncreaseDataArr != undefined && vIncreaseDataArr.length > 0 ) {
				var str = "";
				for(i = 0; i < vIncreaseDataArr.length; i++){
					str += '<button data-before="'+vIncreaseDataArr[i].spclBefore+'" data-increase="'+vIncreaseDataArr[i].spclIncrease+'">'+vIncreaseDataArr[i].increaseNm+'</button>';
				}
				$('.SelectIncrease div.List').html(str);
			}
			
			if(vIncreaseDataArr.length == 0 || ( vIncreaseDataArr[0].spclBefore == null && vIncreaseDataArr[0].spclIncrease == null ) ){ //증감, 증감률이 없을때
				$('.SelectIncrease').addClass('Hidden')
			}
			
		}
	});	
}

function fnSelectMapSetting(){ //지도 셋팅
	
	$.ajax({
		type    : "POST",
		url     : context + "/economyBoard/selectMapList.do?lang="+lang,
		async   : false,
		data    : {unitySrvcId : vUnitySrvcId, stdIdctId : vStdIdctId, clsfGroupCd : vClsfGroupCd },
		success : function(data) {
			
			var vMapDataArr = data.mapList
			
			if ( vMapDataArr != undefined && vMapDataArr.length > 0 ) {
				
			$('.RegionSelectArea [id^="Map_A_"]').removeClass('Act');
			$('.RegionSelectArea [id^="Btn_A_"]').removeClass('Act');
			$('.RegionSelectArea [id^="Map_A_"]').removeClass('This');
			$('.RegionSelectArea [id^="Btn_A_"]').removeClass('This');
			
				for(i = 0; i < vMapDataArr.length; i++){
					if(i == 0){
						var mapBtn = "";
						if(vMapDataArr[0].levelArr.indexOf('1') != -1){
							mapBtn += '<button class="BtnCity">'+msg_btnCity+'</button>';
							$('.BtnArea .BtnHeader').addClass('Hidden');
						}
						if(vMapDataArr[0].levelArr.indexOf('2') != -1){
							mapBtn += '<button class="BtnRegion">'+msg_btnRegion+'</button>';
							$('.BtnArea .BtnHeader').removeClass('Hidden');
						}
						
						
						$('.RegionSelectArea .AreaType').html(mapBtn);
						if($('.RegionSelectArea .AreaType button').length == 1){
							$('.RegionSelectArea .AreaType').addClass('BtnCnt1');
						}
						$('.RegionSelectArea .AreaType button:first').addClass('This');
						
					}
					if(vMapDataArr[i].levelArr == '1'){
						$('.RegionSelectArea [data-regioncd="'+vMapDataArr[i].clsfCd+'"]').addClass('Act')
					}else{
						$('.RegionSelectArea .Map_00 [id^="Map_A_"]').addClass('Act');
						$('.RegionSelectArea [data-regioncd="'+vMapDataArr[i].clsfCd+'"]').addClass('Act')
					}
				}
				//vBaseSetting = true;
				vRegionArr = new Array();
				$('.ContactRegion .List').empty();
				
				if(vBaseSetting){
					if(paramRegionCdArr != undefined && paramRegionCdArr != ''){
						for(var i = 0; i < paramRegionCdArr.length; i++){
							if(paramRegionCdArr[i] != '' && paramRegionCdArr[i] != undefined){
								$('.RegionSelectArea [id^="Map_A_"][data-regioncd="'+paramRegionCdArr[i]+'"]').trigger('click');
							} 
						}
						
						if(!$('.RegionSelectArea [id^="Map_A_"].This').length){ //선택한 지역에 대한 데이터가 없으면 대표지역으로 초기화
							alert(msg_selectRegionNoData);
						}else{
							return false;
						}
						
					}
					
					$('.RegionSelectArea [id^="Map_A_"][data-regioncd="'+vOwnerRegionCd+'"].Act').trigger('click');
					
				}else{
					$('.RegionSelectArea [id^="Map_A_"].Act').first().trigger('click');
				}
			}
		}
	});
	
}

function fnSelectPeriodSetting(){ //수록주기 셋팅
	
	$.ajax({
		type    : "POST",
		url     : context + "/economyBoard/selectPeriodList.do?lang="+lang,
		async   : false,
		data    : { "unitySrvcIdArr" : vUnitySrvcId, "clsfGroupCdArr" : vClsfGroupCd },
		success : function(data) {
			
			var vPeriodDataArr = data.periodList
			
			if ( vPeriodDataArr != undefined && vPeriodDataArr.length > 0 ) {
				var str = "";
				for(i = 0; i < vPeriodDataArr.length; i++){
					str += '		<button data-cyclse="'+vPeriodDataArr[i].cyclSe+'">'+vPeriodDataArr[i].cyclNm+'</button>';
				}
				$('.SelectPeriod').removeClass('Hidden');
				$('.SelectPeriod div.List').html(str);
				
				if(vBaseSetting){
						$('.SelectPeriod div.List>button[data-cyclse="'+vOwnerCyclSe+'"]').addClass('This');
						$('.SelectPeriod>.BtnPeriod').text($('.SelectPeriod div.List>button[data-cyclse="'+vOwnerCyclSe+'"]').text());
						vCyclSe = vOwnerCyclSe;
						vCyclNm = $('.SelectPeriod div.List>button[data-cyclse="'+vOwnerCyclSe+'"]').text();
				}else{
					$('.SelectPeriod div.List>button:first').trigger('click');
				}
			}
			
			if(vPeriodDataArr.length == 1){
				$('.SelectPeriod').addClass('Hidden')
			}
		}
	});
};

function fnSourceSetting(){//출처 및 통계표 셋팅

	$.ajax({
		type    : "POST",
		url     : context + "/economyBoard/selectSourceList.do?lang="+lang,
		async   : false,
		data    : { unitySrvcIdArr: vUnitySrvcId, clsfGroupCdArr : vClsfGroupCd},
		success : function(data) {
			
			vSourceList = data.sourceList;
			
			var str = "";
			if ( vSourceList != undefined && vSourceList.length > 0 ) {

				for(var i = 0; i < vSourceList.length; i++){
					if(vSourceList[i].tblNm != undefined && vSourceList[i].tblNm != ''){
						str += '<a href="https://nsist.nsi.go.kr/statHtml/statHtml.do" target="_blank" title="'+msg_goToStatTitle+'" onclick="fnGoToStat('+"'"+vSourceList[i].orgId+"','"+vSourceList[i].tblId+"','"+vSourceList[i].tblNm+"'"+');return false;">'
						str += vSourceList[i].stdIdctNm + '-' + vSourceList[i].clsfGroupNm + ' 「' + vSourceList[i].tblNm + '」'
						str += '</a>'
					}
				}
				
				$('.SelectKosisList .List').html(str)
			}
			
		}
	});
}


function fnDetailDataSetting(){
	
	var regionArr = "";
	
	for ( var i = 0 ; i < vRegionArr.length ; i ++ ) {
		if ( i != 0 ) regionArr += ',';
		regionArr += vRegionArr[i].regionCd;
	}
	
	vNoData = false;
	
	$.ajax({
		type    : "POST",
		url     : context + "/economyBoard/selectDetailDataList.do?lang="+lang,
		async   : false,
		data    : { unitySrvcIdArr: vUnitySrvcId, stdIdctIdArr: vStdIdctId, clsfGroupCdArr : vClsfGroupCd, clsfCdArr : vClsfCd, cyclSe : vCyclSe, regionArr : regionArr, spclBefore : vSpclBefore, spclIncrease : vSpclIncrease },
		success : function(data) {
			
			vDetailDataArr = new Array();
			vDetailDataArr = data.data;
			vPrdDeList = data.wrtPnttm;
			
			if ( vDetailDataArr != undefined && vDetailDataArr.length > 0 ) {
				
				fnDetailChartDraw(vDetailDataArr);
				fnStatTableSetting(vDetailDataArr);
				
			}else{
				if(!vBaseSetting){
					alert(msg_noData);
					vNoData = true;
				}
			}
			vBaseSetting = false;
			
		}
	});
	
}

function fnDetailChartDraw( contentList ){
	// 차트 초기화
	while ( vDetailChart.series.length ) {
		vDetailChart.series.removeIndex(0).dispose();
	}
	if ( vDetailLegend !== undefined && vDetailLegend._data._values.length > 0 ) vDetailLegend.dispose();
	
	var vResultData = vPrdDeList.filter((result, index) => {return (vPrdDeList.findIndex((ele) => {return result.wrtPnttm === ele.wrtPnttm}) === index )});
	var vSortData = vResultData.sort((a,b) => a.wrtPnttm - b.wrtPnttm);
	vPrdDeList = vSortData;
	
	// 데이터 세팅
	for( var i = 0; i < vRegionArr.length ; i ++ ) {
		
		var region = new Array();
		var data = new Array();
		
		if( i == 0 ) {
			vUnit = contentList[0].unit
			vDcpt = contentList[0].dcpt
		}
			
		region = contentList.filter(function (ele, index) {return (ele.regionCd == vRegionArr[i].regionCd) ;});
		
		if ( region.length <= 0 ){
			$('.ContactRegion .List button[data-regioncd="'+vRegionArr[i].regionCd+'"]').parents('span').css('opacity', '0.4');
			continue;
		}else{
			$('.ContactRegion .List button[data-regioncd="'+vRegionArr[i].regionCd+'"]').parents('span').css('opacity', '');
		} 
		
		for ( var j = 0 ; j < vPrdDeList.length ; j ++ ) {
			var prdDeYn = false;
			
			
			for ( var k = 0 ; k < region.length ; k ++ ) {
				
				if ( vPrdDeList[j].wrtPnttm == region[k].wrtPnttm ) {
					
					prdDeYn = true;
					var labelVal = fnNumberComma( fnFixedDcmlPoint( region[k].vl, vDcpt ) );
					if(vSpclIncrease == '1'){ //증감률일 경우
						labelVal = fnNumberComma( fnFixedDcmlPoint( region[k].vl, 1 ) );
					}
					
					data.push({
						year: region[k].wrtPnttmString,
						yearStr : fnWrtPnttmStr(region[k].wrtPnttm, vCyclSe, 2),
						cyclNm: region[k].cyclNm,
						region: region[k].regionNm,
						other : region[k].otherNm,
						val: region[k].vl,
						labelVal: labelVal,
						unit: vUnit,
						columnSettings: {
							fill: am5.Color.fromString( vDetailChartColors[i+1] )
						}
					});
					break;
				}
			} 
			if ( !prdDeYn ) {
				data.push({
					year: vPrdDeList[j].wrtPnttmString,
					yearStr : fnWrtPnttmStr(vPrdDeList[j].wrtPnttm, vCyclSe, 2),
					cyclNm : region[0].cyclNm,
//					showBullet: showBullet,
					region: region[0].regionNm
				});
			}
		}
		
			
		var tooltip = am5.Tooltip.new(vDetailRoot,{ 
			getFillFromSprite : false,
			getStrokeFromSprite : true,
			autoTextColor: false,
			getLabelFillFromSprite : true,
			labelText: "[bold fontFamily: Noto-KR]{year}{cyclNm} {region} {other}: {labelVal}[/] {unit}"
		});
		tooltip.get("background").setAll({
			fill : vDetailRoot.interfaceColors.get("background"), 
			fillOpacity : 1
		});
		
		tooltip.label.setAll({
			oversizedBehavior : "wrap",
			maxWidth : $('#chartDiv').width() * 0.7
		});
		
		vDetailSeries = vDetailChart.series.push(am5xy.LineSeries.new(vDetailRoot, {
			name: region[0].regionNm,
			xAxis: xAxis,
		    yAxis: yAxis,
		    categoryXField: "year",
			//maskBullets: false,
		    valueYField: "val",
			spikes : i , 
		    fill: am5.Color.fromString( vDetailChartColors[i+1] ),
		    // fill: colors[i],
		    tooltip: tooltip
		}));
		// 선 세팅
		vDetailSeries.strokes.template.setAll({
			strokeWidth: 3,
			stroke: vDetailSeries.get("fill")
		});
		
		// 선 위에 동그라미 세팅
		vDetailSeries.bullets.push(function(vDetailRoot,vDetailSeries) {
			if(vDetailSeries.get("spikes") == 0){
				return am5.Bullet.new(vDetailRoot, {
					sprite: am5.Circle.new(vDetailRoot, {
						radius: 5,
						fill: vDetailRoot.interfaceColors.get("background"),
						strokeWidth: 2,
						stroke: vDetailSeries.get("fill")
					})
				});
			}else{
				return am5.Bullet.new(vDetailRoot, {
					sprite: am5.Star.new(vDetailRoot, {
						spikes: vDetailSeries.get("spikes") + 2,
						scale : 0.7,
						fill: vDetailRoot.interfaceColors.get("background"),
						strokeWidth: 2,
						stroke: vDetailSeries.get("fill")
					})
				});				
			}
		});

		if ( $(".ViewDec").hasClass("on") ) {
			
			// 수치 세팅
			vDetailSeries.bullets.push(function(){
				return am5.Bullet.new(vDetailRoot, {
					locationY: 1,
					sprite: am5.Label.new(vDetailRoot, {
						centerX: am5.p50,
						centerY: am5.p100,
						fontSize: '12px',
						fontFamily: 'Noto-KR',
						text: "{labelVal}",
						populateText: true
					})
				});
			});
		}		
/*		// 선 위에 동그라미 세팅
		vDetailSeries.bullets.push(function(vDetailRoot,vDetailSeries) {
			return am5.Bullet.new(vDetailRoot, {
				sprite: am5.Circle.new(vDetailRoot, {
					radius: 5,
					fill: vDetailRoot.interfaceColors.get("background"),
					strokeWidth: 2,
					stroke: vDetailSeries.get("fill")
				})
			});
		});*/

		xAxis.data.setAll( data );
		vDetailSeries.data.setAll( data );
		vDetailSeries.showOnInit = false; // animated : false
		
		vDetailSeries.appear();
		
	}
	
	vDetailSeries.events.on("datavalidated", function(ev, target) {
		var today = new Date();
		var thisYear = Number(today.getFullYear());
		var thisMonth = Number(today.getMonth());
		var targetYear = "";
		
		if(vCyclSe == 'Y'){ //년
			    targetYear = thisYear + 10;
			
		}else if(vCyclSe == 'M'){ //월
			var num = thisMonth;
			for(var k = 0; k < 10; k++){ //10개 시점 먼저 보여주려고 10으로 지정
				
				if(num > 9){
					targetYear = thisYear.toString() + thisMonth.toString()
				}else if(num <= 9){
					targetYear = thisYear.toString() + '0' + thisMonth.toString()		
				}
				
				if(num == 12){
					thisYear++
					num = 0;
					thisMonth = 1;
				} else{
					thisMonth ++;
				}
				
				num++;				
			}
			
		}else if(vCyclSe == 'Q'){ //분기
			if(thisMonth < 4){
				thisMonth = 1;
			}else if(thisMonth < 7){
				thisMonth = 2;
			}else if(thisMonth < 10){
				thisMonth = 3;
			}else{
				thisMonth = 4;
			}
			
			var num = thisMonth;
			
			for(var k = 1; k <= 10; k++){
				targetYear = thisYear.toString() + '0' + thisMonth.toString();
				if(num == 4){
					thisYear++
					num = 0;
					thisMonth = 1;
				} else{
					thisMonth ++;
				}
				
				num++;			
			}
		}else if(vCyclSe == 'H'){ //반기
		
			if(thisMonth < 7){
				thisMonth = 1;
			}else {
				thisMonth = 2;
			}
			
			var num = thisMonth;
			
			for(var k = 1; k <= 10; k++){
				targetYear = thisYear.toString() + '0' + thisMonth.toString();
				if(num == 2){
					thisYear++
					num = 0;
					thisMonth = 1;
				} else{
					thisMonth ++;
				}
				
				num++;			
			}			
		}
		
		var afterYearList = [Number(vPrdDeList[vPrdDeList.length - 1].wrtPnttm), targetYear];
		var	afterYear = Math.min.apply(null, afterYearList);
		var afterIdx = -1;
		var afterYn = vPrdDeList.findIndex(function(ele, index, arr) { afterIdx = index; return ele.wrtPnttm == afterYear; });
		if ( afterYn == -1 ) {
			for ( var i = vPrdDeList.length - 1 ; i >= 0; i -- ) {
				if ( vPrdDeList[i].wrtPnttm < afterYear ) {
					afterYear = vPrdDeList[i].wrtPnttm;
					break;
				}
			}
		}
		
		var beforeIdx = (afterIdx-20 < 0) ? 0 : afterIdx-20;
		var beforYearList = [Number(vPrdDeList[0].wrtPnttm), Number(vPrdDeList[beforeIdx].wrtPnttm)];
		var	beforeYear = Math.max.apply(null, beforYearList);
		var beforeYn = vPrdDeList.findIndex(function(ele, index, arr) { return ele.wrtPnttm == beforeYear });
		if ( beforeYn == -1 ) {
			for ( var i = 0 ; i < vPrdDeList.length; i ++ ) {
				if ( beforeYear < vPrdDeList[i].wrtPnttm ) {
					beforeYear = vPrdDeList[i].wrtPnttm;
					break;
				}
			}
		}
		xAxis.zoomToCategories(fnWrtPnttmStr(String(beforeYear),vCyclSe, 4) , fnWrtPnttmStr(String(afterYear), vCyclSe, 4));
		
	});

	// 범례 위치 => unshift : 위 / push : 아래
	vDetailLegend = vDetailChart.children.push(am5.Legend.new(vDetailRoot, {
		centerX:am5.p50,
		x: am5.p50,
		useDefaultMarker: true
	}));
	
	vDetailLegend.labels.template.setAll({
		oversizedBehavior : "wrap",
		maxWidth : $('#chartDiv').width() * 0.7
	})
	vDetailLegend.data.setAll(vDetailChart.series.values);

}

function fnStatTableSetting( contentList ){
	// 테이블 리셋
	$(".DataTable thead tr").remove();
	$(".DataTable tbody tr").remove();
	vTableData = new Array();
	
	var thead = '';
	var tbody = '';
	
    var vTableRow = new Array();

	for ( var i = 0 ; i < vRegionArr.length; i ++ ) {
		
		if( i == 0 ) {
			vTableRow = new Array();
			thead += '<tr><th scope="col"> </th>';
			vTableRow.push("");
			for ( var j = 0 ; j < vPrdDeList.length ; j ++ ) {
/*				thead += '<th scope="col">'+ vPrdDeList[j].wrtPnttmString + vCyclNm + '</th>';
				vTableRow.push(vPrdDeList[j].wrtPnttmString + vCyclNm);*/
				thead += '<th scope="col">'+ vPrdDeList[j].wrtPnttmString + '</th>';
				vTableRow.push(vPrdDeList[j].wrtPnttmString);
			}
			thead += '</tr>';
			vTableData.push(vTableRow);
		} 
		
		vTableRow = new Array(); //row 초기화
		
		region = contentList.filter(function (ele, index) {return (ele.regionCd == vRegionArr[i].regionCd) ;});
		
		if ( region.length <= 0 ) continue;
		
		tbody += '<tr><th scope="row">'+ region[0].regionNm +'</th>';
		vTableRow.push(region[0].regionNm);
		for ( var j = 0 ; j < vPrdDeList.length ; j ++ ) {
			
			var prdDeYn = false;
			
			for ( var k = 0 ; k < region.length ; k ++ ) {
				if ( region[k].wrtPnttm == vPrdDeList[j].wrtPnttm ) {
					prdDeYn = true;
					if ( fnIsNullToStr( region[k].vl ) == '' ) {
						tbody += '<td> </td>';
						vTableRow.push("");
					} else {
						var tableVl = fnNumberComma( fnFixedDcmlPoint( region[k].vl, vDcpt ) );
					      if(vSpclIncrease == '1'){ //증감률일 경우
					       tableVl = fnNumberComma( fnFixedDcmlPoint( region[k].vl, 1 ) );
					      }
					      tbody += '<td>'+ tableVl +'</td>';
					      vTableRow.push(tableVl);
					}
					break;
				}
			}
			
			if ( !prdDeYn ) {
				
				tbody += '<td> </td>';
				vTableRow.push("");
			}
		}
		tbody += '</tr>';
		vTableData.push(vTableRow);
	}
	
	// 테이블 세팅
	$(".DataTable thead").append( thead );
	$(".DataTable tbody").append( tbody );
	setTimeout( function() {
		$(".DataTable").scrollLeft( $(".DataTable").prop('scrollWidth') );
	}, 500);
			
	
	if(vUnit != null && vUnit != undefined){
		$('.InfoBox .Unit').removeClass('Hidden');
		$('.InfoBox .Unit').text("(" + msg_unit + ":" + vUnit + ")");
		$('.ChartFooter .ChartUnit').removeClass('Hidden');
		$('.ChartFooter .ChartUnit').text(msg_unit + ": (" + vUnit + ")");
	}else{
		$('.InfoBox .Unit').addClass('Hidden')
		$('.ChartFooter .ChartUnit').addClass('Hidden')
	}
	
				
	if ( vSourceList != undefined && vSourceList.length > 0 && vSourceList[0].tblNm != undefined && vSourceList[0].tblNm != '') {
		$('.InfoCont .BtnGroup a.goToStat').attr('onClick', 'fnGoToStat("'+vSourceList[0].orgId+'", "'+vSourceList[0].tblId+'", "'+vSourceList[0].tblNm+'");return false;');
		$('.InfoCont .BtnGroup a.goToStat').removeClass('Hidden')
	}else{
		$('.InfoCont .BtnGroup a.goToStat').addClass('Hidden');
	}
	
}

