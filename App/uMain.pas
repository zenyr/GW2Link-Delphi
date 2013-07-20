unit uMain;

{

  GW2Link for windows by zenyr (zenyr@zenyr.com)

  forked from Blaaguuu/GW2Link

}
interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants,
  System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, Vcl.Buttons, Vcl.StdCtrls, Vcl.ExtCtrls,
  uGW2Linker, IdBaseComponent, IdComponent, IdCustomTCPServer,
  IdCustomHTTPServer, IdHTTPServer, IdContext;

type
  TFrmMain = class(TForm)
    Tmr: TTimer;
    HTTP: TIdHTTPServer;
    MemOutput: TMemo;
    procedure TmrTimer(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
    procedure HTTPCommandGet(AContext: TIdContext;
      ARequestInfo: TIdHTTPRequestInfo; AResponseInfo: TIdHTTPResponseInfo);
    procedure FormCloseQuery(Sender: TObject; var CanClose: Boolean);
  private
    { Private declarations }
    GW2Linker: TGW2Linker;
  public
    { Public declarations }
  end;

var
  FrmMain: TFrmMain;

implementation

uses Math;
{$R *.dfm}

procedure TFrmMain.FormCloseQuery(Sender: TObject; var CanClose: Boolean);
begin
  CanClose := Tag = 0;
end;

procedure TFrmMain.FormCreate(Sender: TObject);
begin
  GW2Linker := TGW2Linker.Create;
  HTTP.DefaultPort := 8428;
  HTTP.Active := true;
  TmrTimer(nil);
end;

procedure TFrmMain.FormDestroy(Sender: TObject);
begin
  Tmr.Enabled := false;
  HTTP.StopListening;
  FreeAndNil(GW2Linker);
end;

procedure TFrmMain.HTTPCommandGet(AContext: TIdContext;
  ARequestInfo: TIdHTTPRequestInfo; AResponseInfo: TIdHTTPResponseInfo);
var
  JSON: string;
begin
  Tag := 1;
  try
    if (LowerCase(ARequestInfo.URI) = '/gw2.json') then
    begin
      AResponseInfo.CustomHeaders.AddValue('Access-Control-Allow-Origin', '*');
      JSON := GW2Linker.JSON;
      AResponseInfo.ContentText := JSON;
    end
    else
      AResponseInfo.ResponseNo := 404;
  finally
    Tag := 0;
  end;
end;

procedure TFrmMain.TmrTimer(Sender: TObject);
var
  S: string;
begin
  try
    if (Assigned(GW2Linker)) then
    begin
      S := FloatToStr(roundto(GW2Linker.version, -2)) + ' - STATUS:' +
        GW2Linker.status;
      MemOutput.text := GW2Linker.JSON;
    end
    else
      S := 'Not assigned.';
  finally
    caption := 'GW2Linker delphi ' + S;
  end;
end;

end.
