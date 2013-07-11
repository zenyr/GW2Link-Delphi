object FrmMain: TFrmMain
  Left = 0
  Top = 0
  Caption = 'GW2Link (forked)'
  ClientHeight = 190
  ClientWidth = 304
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'Tahoma'
  Font.Style = []
  OldCreateOrder = False
  OnCreate = FormCreate
  OnDestroy = FormDestroy
  PixelsPerInch = 96
  TextHeight = 12
  object Tmr: TTimer
    Interval = 100
    OnTimer = TmrTimer
    Left = 264
    Top = 144
  end
  object HTTP: TIdHTTPServer
    Bindings = <>
    OnCommandGet = HTTPCommandGet
    Left = 240
    Top = 136
  end
end
