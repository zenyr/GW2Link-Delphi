unit uGW2Linker;

interface

uses Classes;

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
    _JSON: string;
    uThread: TThread;
    _haltThread: boolean;
    _threadBusy: boolean;
    code: byte;
    procedure _fetchJSON;
  public
    pdata: PLinkedMem;
    constructor Create;
    destructor Destroy; override;
    property version: Extended read _version;
    property JSON: string read _JSON;
    function camRot: single;
    function avatarRot: single;
    function server: integer;
    function map: integer;
    function status: string;

    procedure haltThread;
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
  _lastTick := 0;
  code := 1;
  hMapFile := OpenFileMapping(FILE_MAP_ALL_ACCESS, False, MapFileName);
  if hMapFile = 0 then
    hMapFile := CreateFileMapping($FFFFFFFF, nil, PAGE_READWRITE, 0,
      SizeOf(TLinkedMem), MapFileName);
  pdata := MapViewOfFile(hMapFile, FILE_MAP_ALL_ACCESS, 0, 0, 0);

  if pdata = nil then
    CloseHandle(hMapFile);
  _haltThread := False;
  uThread := TThread.CreateAnonymousThread(_fetchJSON);
  uThread.FreeOnTerminate := False;
  uThread.Start;
end;

destructor TGW2Linker.Destroy;
begin
  haltThread;
  uThread.Free;
  UnmapViewOfFile(pdata);
  CloseHandle(hMapFile);
end;

procedure TGW2Linker.haltThread;
begin
  _haltThread := true;
  uThread.Terminate;
end;

function TGW2Linker.map: integer;
begin
  result := pdata^.context[29] * 256 + pdata^.context[28];
end;

function TGW2Linker.server: integer;
begin
  result := pdata^.context[37] * 256 + pdata^.context[36];
end;

function TGW2Linker.status: string;
const
  text: array [0 .. 3] of string = ('Good', 'Paused', 'ERR MVOF', 'Err OFM');
begin
  result := text[code];
end;

procedure TGW2Linker._fetchJSON;
  function f(fNum: Extended): string; overload;
  begin
    result := FloatToStr(RoundTo(fNum, -1));
  end;
  function f(fStr: string): string; overload;
  begin
    result := '"' + StringReplace(fStr, '"', '\"', [rfReplaceAll]) + '"';
  end;

var
  Errcnt: integer;
begin
  Errcnt := 0;
  while not _haltThread do
    try
      try
        _JSON := format
          ('{"version":%s,"tick":%s,"code":%s,"status":%s,"game":%s,"server":%s,'
          + '"map":%s,"name":%s,"pos":[%s,%s,%s],"prot":%s,"crot":%s}',
          [f(version), f(_lastTick), f(code), f(status), f(pdata^.name),
          f(server), f(map), f(pdata^.identity), f(pdata^.fAvatarPosition[0]),
          f(pdata^.fAvatarPosition[1]), f(pdata^.fAvatarPosition[2]),
          f(avatarRot), f(camRot)]);
        if map > 0 then
        begin
          if (_lastTick <> pdata^.uiTick) then
          begin
            code := 0;
            _lastTick := pdata^.uiTick;
            if (Errcnt > 0) then
              dec(Errcnt);
          end
          else
          begin
            code := 1;
            inc(Errcnt);
          end;
        end
        else
          code := 1;
        sleep(100);
      except
        _JSON := format('{version:%s,code:%s}', [f(version), f(1)]);
      end;
    finally
      _threadBusy := False;
    end;

end;

end.
