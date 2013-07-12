unit uGW2Linker;

interface

type
  PLinkedMem = ^TLinkedMem;

  TLinkedMem = packed record
    uiVersion, uiTick: Cardinal;
    fAvatarPosition, fAvatarFront, fAvatarTop: array [0 .. 2] of single;
    name: array [0 .. 255] of Char;
    fCameraPosition, fCameraFront, fCameraTop: array [0 .. 2] of single;
    identity: array [0 .. 255] of Char;
    context_len: Cardinal;
    context: array [0 .. 255] of byte;
    description: array [0 .. 2047] of Char;
  end;

  TGW2Linker = class
  const
    MapFileName = 'MumbleLink';
  private
    hMapFile: THandle;
    _version: Extended;
    _lastTick: Cardinal;
    function round(s: single): Extended;
  public
    pdata: PLinkedMem;
    constructor Create;
    destructor Destroy; override;
    property version: extended read _version;
    function camRot: single;
    function avatarRot: single;
    function server: integer;
    function map: integer;
    function status: string;

    function JSON: string;
  end;

implementation

uses SysUtils, Math, DBXJson, Windows, Messages;
{ TGW2Linker }

function TGW2Linker.avatarRot: single;
begin
  result := Math.ArcTan2(pdata^.fAvatarFront[2], pdata^.fAvatarFront[0])
    * 180 / pi;
  if result < 0.0 then
    result := 360 + result;
end;

function TGW2Linker.camRot: single;
begin
  result := Math.ArcTan2(pdata^.fCameraFront[2], pdata^.fCameraFront[0])
    * 180 / pi;
  if result < 0.0 then
    result := 360 + result;
end;

constructor TGW2Linker.Create;
begin
  _version := 1.1;
  hMapFile := OpenFileMapping(FILE_MAP_ALL_ACCESS, False, MapFileName);
  if hMapFile = 0 then
    hMapFile := CreateFileMapping($FFFFFFFF, nil, PAGE_READWRITE, 0,
      SizeOf(TLinkedMem), MapFileName);
  pdata := MapViewOfFile(hMapFile, FILE_MAP_READ, 0, 0, 0);
  if pdata = nil then
    CloseHandle(hMapFile);
end;

destructor TGW2Linker.Destroy;
begin
  UnmapViewOfFile(pdata);
  CloseHandle(hMapFile);
  inherited;
end;

function TGW2Linker.JSON: string;
var
  j: TJSONObject;
  a: TJSONArray;

begin
  try
    j := TJSONObject.Create;
    j.AddPair('version', TJSONNumber.Create(round(version)));
    j.AddPair('status', status);
    j.AddPair('game', pdata^.name);
    j.AddPair('server', TJSONNumber.Create(server));
    j.AddPair('map', TJSONNumber.Create(map));
    j.AddPair('name', pdata^.identity);
    a := TJSONArray.Create;
    a.Add(round(pdata^.fAvatarPosition[0]));
    a.Add(round(pdata^.fAvatarPosition[1]));
    a.Add(round(pdata^.fAvatarPosition[2]));
    j.AddPair('pos', a);
    j.AddPair('prot', TJSONNumber.Create(round(avatarRot)));
    j.AddPair('crot', TJSONNumber.Create(round(camRot)));
  finally
    result := j.ToString;
    j.Free;
  end;
end;

function TGW2Linker.map: integer;
begin
  result := pdata^.context[29] * 256 + pdata^.context[28];
end;

function TGW2Linker.round(s: single): Extended;
begin
  result := RoundTo(s, -2);
end;

function TGW2Linker.server: integer;
begin
  result := pdata^.context[37] * 256 + pdata^.context[36];
end;

function TGW2Linker.status: string;
begin
  if hMapFile = 0 then
    result := 'Failed - "OFM"'
  else if pdata = nil then
    result := 'Failed - "MVOF"'
  else if _lastTick < pdata^.uiTick then
    result := 'Good'
  else
    result := 'Paused';
  _lastTick := pdata^.uiTick;
end;

end.
