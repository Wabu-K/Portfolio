# JavaScript
N高等学校でのインターンで無断欠席者への架電業務がありました。

1. Google formで作られた「欠席連絡フォーム」と「遅刻・IDカード忘れフォーム」から、手作業で出欠席管理用のGoogle Spreadsheetに情報を記入する。 
2. 無断欠席者を洗い出し、一覧を作って職員にSlackで報告しチェックを受ける。
3. 電話番号の一覧から電話番号を探し、架電を行う。

この業務を手作業で行っており、大変苦痛だったため、

1. 2つのフォームからSpreadsheetに自動で反映し、Slack送信用の架電対象者の情報をメッセージボックスで表示する
2. 反映元のチェック欄にチェックを入れる
3. 架電対象者の名前と電話番号2種をメッセージボックスで表示する

という二つの機能を持ったGoogle App Scriptのコードを書きました。
JavaScriptを書くのは初めてでしたが、Googleで検索して出てきたパーツの組み合わせで完成しました。

[デモスプレッドシート](https://docs.google.com/spreadsheets/d/1vlG3SYrjXS8zs0Kp5Ti7UKqL7_LoN-A3VRr73aps8UU/edit?usp=sharing)  
[デモ用データ引用シート](https://docs.google.com/spreadsheets/d/1YHsv6UWLEsx8Gl-LqXzfB--Zx7h-b_ZydihTSp9Htac/edit?usp=sharing)
