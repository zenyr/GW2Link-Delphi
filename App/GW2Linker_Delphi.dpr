program GW2Linker_Delphi;

uses
  Vcl.Forms,
  uMain in 'uMain.pas' {FrmMain},
  uGW2Linker in 'uGW2Linker.pas';

{$R *.res}

begin
  Application.Initialize;
  ReportMemoryLeaksOnShutdown := true;
  Application.MainFormOnTaskbar := True;
  Application.CreateForm(TFrmMain, FrmMain);
  Application.Run;
end.
