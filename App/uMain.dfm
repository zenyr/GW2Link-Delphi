object FrmMain: TFrmMain
  Left = 0
  Top = 0
  Caption = 'GW2Link (forked)'
  ClientHeight = 239
  ClientWidth = 363
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'Tahoma'
  Font.Style = []
  OldCreateOrder = False
  OnCloseQuery = FormCloseQuery
  OnCreate = FormCreate
  OnDestroy = FormDestroy
  PixelsPerInch = 96
  TextHeight = 12
  object MemOutput: TMemo
    Left = 0
    Top = 0
    Width = 363
    Height = 239
    Align = alClient
    TabOrder = 0
  end
  object Tmr: TTimer
    Interval = 100
    OnTimer = TmrTimer
    Left = 40
    Top = 32
  end
  object HTTP: TIdHTTPServer
    Bindings = <>
    OnCommandGet = HTTPCommandGet
    Left = 240
    Top = 136
  end
end
