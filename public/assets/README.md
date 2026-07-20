# TERRA asset pipeline

게임 화면은 한 장의 평면 이미지가 아니라 다음 순서의 독립 레이어를 조합한다.

```text
ground → path → buildings → props → actors → foreground
```

## Planned folders

- `terra/layers/`: 광장과 개인 홈의 다중 레이어 이미지
- `characters/male/`, `characters/female/`: 플레이어 스프라이트 시트와 프로필 이미지
- `props/`: 공동 건설소, 관측소, 전광판, 수집 노드
- `fx/`: 시그널 잔해와 Noise Station 루프

이미지 생성 에셋은 이미지 안에 텍스트를 넣지 않는다. 캐릭터·애니메이션 시트는 `generate2dsprite` 스킬을 사용하고, 원본 생성물과 처리된 투명 PNG, 프레임별 PNG, 프롬프트, QC 메타데이터를 함께 보관한다.

현재 P0에서는 의도적으로 Canvas 플레이스홀더를 사용한다. 실제 이미지를 추가해도 `TerraCanvas`의 레이어 순서와 좌표 데이터는 유지한다.

## Active character atlas

현재 게임 런타임은 독립 paper-doll 레이어 대신 다음 고정 프리셋 아틀라스를 사용한다.

```text
sprites/terra-explorer-v3/direction-atlas/
├── raw/       # image-generation outputs
└── processed/ # 768×768 RGBA atlases, 3×3 cells × 256px
```

프리셋은 `male-cute`, `male-composed`, `female-cute`, `female-composed` 네 가지다. 각 아틀라스는 위왼쪽·위·위오른쪽 / 왼쪽·빈칸·오른쪽 / 아래왼쪽·아래·아래오른쪽 순서이며, `TerraCanvas`가 이동 방향에 맞는 셀을 선택한다. 상호작용 모션은 별도 대형 시트를 만들지 않고 코드 오버레이로 손을 뻗는 짧은 이펙트를 표시한다.
