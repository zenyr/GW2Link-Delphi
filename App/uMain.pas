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
    procedure TmrTimer(Sender: TObject);
    procedure FormCreate(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
    procedure HTTPCommandGet(AContext: TIdContext;
      ARequestInfo: TIdHTTPRequestInfo; AResponseInfo: TIdHTTPResponseInfo);
  private
    { Private declarations }
    GWLinker: TGW2Linker;
  public
    { Public declarations }
  end;

var
  FrmMain: TFrmMain;

implementation

uses Math;
{$R *.dfm}

procedure TFrmMain.FormCreate(Sender: TObject);
begin
  GWLinker := TGW2Linker.Create;
  HTTP.DefaultPort := 8428;
  HTTP.Active := true;
  TmrTimer(nil);
end;

procedure TFrmMain.FormDestroy(Sender: TObject);
begin
  FreeAndNil(GWLinker);
end;

procedure TFrmMain.HTTPCommandGet(AContext: TIdContext;
  ARequestInfo: TIdHTTPRequestInfo; AResponseInfo: TIdHTTPResponseInfo);
begin
  if (LowerCase(ARequestInfo.URI) = '/gw2.json') then
  begin
    AResponseInfo.CustomHeaders.AddValue('Access-Control-Allow-Origin', '*');
    AResponseInfo.ContentText := GWLinker.JSON;
  end
  else
    AResponseInfo.ResponseNo := 404;
end;

procedure TFrmMain.TmrTimer(Sender: TObject);
var
  S: string;
begin
  try
    if (Assigned(GWLinker)) then
    begin
      S := GWLinker.version + ' - STATUS:' + GWLinker.status;
    end
    else
      S := 'Not assigned.';
  finally
    caption := 'GW2Linker ' + S;
  end;
end;

end.
