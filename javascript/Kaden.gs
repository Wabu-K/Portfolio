/////////////////////////
//        説明書        //
/////////////////////////

/*
必要なものを上の関数選択欄で選んで実行(▶︎)してください。
月曜午前出勤の方は、各日の備考欄に今週一週分の「オンラインcp」の記入をお願いします。
(月〜金あるとは限らないので例外処理が面倒で自動化やめました。)

FullTask:出欠席フォーム・遅刻カード忘れフォームを反映して、無断欠席者の一覧を表示する。
checkAbsence:出欠席フォームを反映
checkLate:遅刻カード忘れフォームを反映
SlackMessage:無断欠席者を確認してSlack投稿文を表示する。

////
Kaden:架電の際に電話番号を表示する。
////
*/

//グローバル領域(ソースファイル全体で使える変数の宣言)
//出欠簿シートの操作
    //アクティブなスプレッドシートのシートを取得する
    let mySheet = SpreadsheetApp.getActiveSheet();

    //今日の日付
    var date = new Date();
    var mon = date.getMonth() + 1;
    var d2 = date.getDate();
    var dayOfWeek = date.getDay();
    var dayOfWeekStr = [ "日", "月", "火", "水", "木", "金", "土" ][dayOfWeek];
    var now = mon+"/"+d2+"("+dayOfWeekStr+")";

    //日付で出欠簿から本日の欄を検索
    var textFinderDay = mySheet.createTextFinder(now);
    var rangesDay = textFinderDay.findAll();

    let TodayEreaRow = rangesDay[0].getRow(); //今日の範囲　行
    let TodayEreaColumn = rangesDay[0].getColumn(); //今日の範囲 列
      //今日の生徒枠の左上
      let selectedRow = TodayEreaRow + 4;
      let selectedColumn = TodayEreaColumn ;

    //エラーメッセージ
    let errorMessage = '';


function FullTask() { 
  checkAbsence();
  checkLate();
  SlackMessage();
}


function checkAbsence(){
  //出欠席連絡フォームを取得
    // (1)Spreadsheetファイルを開く
    const AbsenceSpreadSheetId = "AbsenceForm-sheet-ID";//スプレッドシートのID(URLの/d/と/editの間にある文字列)
    const AbsenceSpreadSheet = SpreadsheetApp.openById(AbsenceSpreadSheetId);
    // (2)Sheetを開く
    const AbsenceSheetId = "千葉";//シートの指定
    const AbsenceSheet = AbsenceSpreadSheet.getSheetByName(AbsenceSheetId);
    // (3)セルの範囲を指定・(4)値の取得
    var columnCount = AbsenceSheet.getRange('B:B').getValues(); //B列の値を配列で取得
    var LastRow = columnCount.filter(String).length;  //空白を除き、配列の数を取得(生徒人数)
    
    console.log(LastRow);

    //出欠席フォームループ
    if (LastRow > 2){ //記録0件エラー回避
      //学籍番号の配列の取得
      var GakusekiTable = AbsenceSheet.getRange('D3:D'+ LastRow).getValues(); 
      //欠席・遅刻の配列の取得
      var ReasonTable = AbsenceSheet.getRange('H3:H'+ LastRow).getValues(); 

      var Num = GakusekiTable.length ; //人数
      for(let i = 0; i < Num; i++) {

        //学籍番号で検索
        var textFinder = mySheet.createTextFinder(String(GakusekiTable[i]).toUpperCase());
        var ranges = textFinder.findAll();

        if (ranges.length != 0 ){
          //行に書き込み
          var columnMemo = selectedColumn + 3;
          var prm = parseInt(ranges[0].getRow());
          SpreadsheetApp.getActiveSheet().getRange(prm,columnMemo).setValue(ReasonTable[i]+'連絡あり');//「〇〇連絡あり」
          AbsenceSheet.getRange(i+3,15).setValue('◯');
        }else{
          errorMessage = errorMessage　+ "欠席フォームで" + String(GakusekiTable[i]) +"をスキップしました。(学籍番号の間違いに注意)\\n";
        }

      }
    }
  
   console.log('checkAbsenceは動いたよ');
}

function checkLate(){
  //遅刻・忘れフォームを取得
    // (1)Spreadsheetファイルを開く
    const LateSpreadSheetId = "LateForm-sheet-ID"; //スプレッドシートのID(URLの/d/と/editの間にある文字列)
    const LateSheetId = '本日の遅刻・カード忘れの民';//シートの指定
    var LateSpreadSheet = SpreadsheetApp.openById(LateSpreadSheetId);
    // (2)Sheetを開く
    var LateSheet = LateSpreadSheet.getSheetByName(LateSheetId);
    // (3)セルの範囲を指定・(4)値の取得
    var columnCount = LateSheet.getRange('A:A').getValues(); // A列の値を配列で取得
    var LastRow = columnCount.filter(String).length;  //空白を除き、配列の数を取得(生徒人数)

  if (LastRow > 2){//記録0件エラー回避
    //学籍番号の配列を取得
    var GakusekiTable = LateSheet.getRange('C3:C' + LastRow).getValues();
    //登校時刻の配列を取得
    var TimeTable = LateSheet.getRange('B3:B' + LastRow).getValues();  
    
    //遅刻・カード忘れフォームループ
    var LateNum = GakusekiTable.length ; //記入人数
    for(let i = 0; i < LateNum; i++) {
    
      //学籍番号で検索
      var textFinder = mySheet.createTextFinder(String(GakusekiTable[i]).toUpperCase());
      var LateRanges = textFinder.findAll();
    
      //行に書き込み
      if (LateRanges.length){
        var ColumnMemo = selectedColumn + 2;//時刻行
        var Prm = parseInt(LateRanges[0].getRow());
        SpreadsheetApp.getActiveSheet().getRange(Prm,ColumnMemo).setValue(TimeTable[i]);//時刻記入
      }else{
        errorMessage = errorMessage　+ "遅刻フォームで" + String(GakusekiTable[i]) +"をスキップしました(学籍番号の間違いに注意)\\n"
      
      }
    }
  } 
   　console.log('checkLateは動いたよ');
}

function SlackMessage(){
  //描画更新
    SpreadsheetApp.flush();
  //今日の範囲の表を取りだす
    // (1)Spreadsheetファイルを開く、(2)Sheetを開く
    //const SpreadSheet = SpreadsheetApp.openById(mySpreadSheetId);
    //const Sheet = SpreadSheet.getSheetByName(mySheetId);
    const Sheet = SpreadsheetApp.getActiveSheet();
        
    var columnCount = Sheet.getRange('A:A').getValues(); //A列の値を配列で取得
    var NumOfPeople = columnCount.filter(String).length;  //空白を除き、配列の数を取得(生徒人数)
    
    var EreaTable = Sheet.getRange(selectedRow,selectedColumn,NumOfPeople-3,4).getValues();//今日の欄を取得
    var NameTelTable = Sheet.getRange(7,2,NumOfPeople-3,5).getValues();//名前などの欄を取得
  

  //メッッセージの変数、カウンタの初期化  
  let Message4Slack = '本日の無断欠席者です。確認をお願い致します。\\n\\n';
  let counter = 0;//無断欠席者0人かを判別するためのカウンタ

  //架電対象の名前と生徒固有の備考(架電不要etc)を取得
  for(let j = 0; j < NameTelTable.length; j++) {//人数の数だけ繰り返す
    
    if(EreaTable[j][1]=='欠席' && EreaTable[j][3].length==0){//出欠が「欠席」かつ備考欄が空欄ならば
      
      if (NameTelTable[j][4] == ''){//生徒固有の備考（F列）が空欄ならば
        Message4Slack = Message4Slack + NameTelTable[j][0]+NameTelTable[j][1]+'\\n';
      }else{//生徒固有の備考（F列）に入力があれば
        Message4Slack = Message4Slack + NameTelTable[j][0]+NameTelTable[j][1]+'：'+NameTelTable[j][4]+'\\n';
      }
      counter++;
    }
  }
  
  if (errorMessage != ''){
    errorMessage = errorMessage + '続けますか？';
    var go = Browser.msgBox('エラーでスキップした箇所',errorMessage, Browser.Buttons.OK_CANCEL);
    Logger.log(go);
    if (go == 'cancel'){
      return 0;
    }
  }
 
  if (counter==0){//無断欠席者0人かの判別
    Browser.msgBox('Slack貼り付け文面','本日の無断欠席者は0人です。', Browser.Buttons.OK);
  }else{
    Browser.msgBox('Slack貼り付け文面',Message4Slack, Browser.Buttons.OK);
  }
}

/*
function checkOnlineCampus(){
  //入力
  var OnlineName = Browser.inputBox("オンラインキャンパス出席者の名前を書いてください");
  // 配列に分割
  let re = /[^\s]+/g
  let match = OnlineName.match(re)
  
  //今日の範囲の表を取りだす
  var EreaTable = mySheet.getRange(selectedRow,selectedColumn,125,4).getValues();
  var NameTelTable = mySheet.getRange(7,2,125,5).getValues();
  
}
*/

function Kaden() {
  //原簿の呼び出し
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const originalListName = '名簿(原簿)';
  const originalList = ss.getSheetByName(originalListName);
  
  //人数の取得
  var AVals = originalList.getRange('A:A').getValues(); //A列の値を配列で取得
  var NumOfPeopleKaden = AVals.filter(String).length;  //空白を除き、配列の数を取得(生徒人数)
  
  //配列の結合
  var originalSheet = originalList.getRange(2,19,NumOfPeopleKaden - 1 ,2).getValues();//原簿の電話番号欄2列を取得
  var originalNameSheet = originalList.getRange(2,1,NumOfPeopleKaden - 1,5).getValues();//原簿の学籍番号〜名の5列を取得
  var Field = [];//結合先の配列を宣言
  
  for (let k = 0; k < originalNameSheet.length ;k++){   //[学籍番号,姓+名,保証人電話番号,保証人携帯番号]の配列に結合
    Field.push([originalNameSheet[k][0],originalNameSheet[k][3]+originalNameSheet[k][4],originalSheet[k][0],originalSheet[k][1]]);
  }
  
  //出欠簿(シート1について)
  //今日の範囲の表を取りだす
  var columnCount = mySheet.getRange('A:A').getValues(); //A列の値を配列で取得
  var NumOfPeople = columnCount.filter(String).length;  //空白を除き、配列の数を取得(生徒人数)
  
  var EreaTable = mySheet.getRange(selectedRow,selectedColumn,NumOfPeople-3,4).getValues();//今日の欄を取得
  var NameTelTable = mySheet.getRange(7,1,NumOfPeople-3,6).getValues();//生徒の名前などの欄を取得
    
  let Message = '';
  let counter = 0;//無断欠席者0人かを判別するためのカウンタ

  //名前と電話番号の取得
  for(let j = 0; j < NameTelTable.length; j++) {
    
    //Logger.log(NameTelTable[j][5]);
      if(EreaTable[j][1]=='欠席' && EreaTable[j][3].length==0){
        
        var words = NameTelTable[j][0];
        var Lib = originalList.getRange(2,1,NumOfPeopleKaden - 1).getValues().flat();
        var result = Lib.indexOf(words);
        
        if (NameTelTable[j][5] == ''){
          Message = Message + NameTelTable[j][1]+NameTelTable[j][2]+'：'+Field[result][2]+'：'+Field[result][3]+'\\n';
        }else{
          Message = Message + NameTelTable[j][1]+NameTelTable[j][2]+'：'+Field[result][2]+'：'+Field[result][3]+'：'+NameTelTable[j][5]+'\\n';
        }
      counter++;
      }
  }
  
  if (errorMessage != ''){
    errorMessage = errorMessage + '続けますか？';
    var go = Browser.msgBox('エラーでスキップした箇所',errorMessage, Browser.Buttons.OK_CANCEL);
    if (go == 'cancel'){
      return 0;
    }
  }
 
 Browser.msgBox('架電対象',Message,Browser.Buttons.OK);
  
  
}
