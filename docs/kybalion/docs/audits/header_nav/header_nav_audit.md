# Header Navigation Audit

- Pages scanned: 22
- Header/menu controls found: 618
- Pages without header/menu controls: 0

## Canonical Controls Index

| Canonical Name | Quick Role | Primary Surface |
|---|---|---|
| `main_menu_button_1` | Global main-menu trigger + panel contract | Shared header/menu wrapper |
| `doc_menu_link_1` | Standard navigation/document menu item contract | `#menuPanel` and `#menuSessionsFlyout` |
| `sessions_trigger_1` | Sessions submenu trigger + flyout contract | Documents section in `#menuPanel` |
| `auth_menu_link_1` | Auth state menu links (signed-out/signed-in) | Navigation section in `#menuPanel` |
| `docs_admin_action_button_1` | Docs admin upload/create header actions | Docs `.header-actions` cluster |
| `reader_profile_button_1` | Reader account/profile action controls | Reader header controls area |
- Reference glossary definitions: [Header Navigation Cleanup Plan — Control Glossary](header_nav_cleanup_plan.md#control-glossary).

## Strict Canonical Identity Enforcement

- Policy: canonical names are treated as strict identity names in this audit. All fields in the strict fingerprint must match exactly, otherwise variants are auto-renamed for uniqueness.
- Strict fingerprint fields: control_type, label, text, title, aria_label, role, aria_controls, aria_expanded, aria_haspopup, target, id, classes, context_signature, is_menu_item, is_dropdown_trigger, placement

| Base Canonical Name | Matched Controls | Unique Signatures | Strict Status |
|---|---:|---:|---|
| main_menu_button_1 | 22 | 2 | MISMATCH |
| doc_menu_link_1 | 440 | 40 | MISMATCH |
| sessions_trigger_1 | 22 | 2 | MISMATCH |
| auth_menu_link_1 | 66 | 26 | MISMATCH |
| docs_admin_action_button_1 | 51 | 6 | MISMATCH |
| reader_profile_button_1 | 1 | 1 | PASS |

### Permanent Variant Names (Strict Mismatches)

#### main_menu_button_1

| Auto Name | Count | Pages | Sample Label | Sample ID | Sample Classes |
|---|---:|---:|---|---|---|
| main_menu_button_docs_header_actions | 17 | 17 | Main Menu | menuBtn | button secondary |
| menu_button_1 | 5 | 5 | Main Menu | menuBtn | button secondary |

- Signature details:
  - `main_menu_button_docs_header_actions`: control_type=button; label=Main Menu; text=Main Menu; aria_controls=menuPanel; aria_expanded=false; aria_haspopup=true; target=menuBtn; id=menuBtn; classes=button secondary; context_signature=html body header page-header div header-content div header-actions div menu-wrapper button button secondary menubtn; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `menu_button_1`: control_type=button; label=Main Menu; text=Main Menu; aria_controls=menuPanel; aria_expanded=false; aria_haspopup=true; target=menuBtn; id=menuBtn; classes=button secondary; context_signature=html body div page-wrap header topbar div menu-wrapper button button secondary menubtn; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu

#### doc_menu_link_1

| Auto Name | Count | Pages | Sample Label | Sample ID | Sample Classes |
|---|---:|---:|---|---|---|
| doc_menu_link_assets | 17 | 17 | Assets | (none) | menu-link admin-only is-hidden |
| doc_menu_link_document_library | 17 | 17 | Document Library | (none) | menu-link |
| doc_menu_link_general | 17 | 17 | General | (none) | menu-link |
| doc_menu_link_home | 17 | 17 | Home | (none) | menu-link |
| doc_menu_link_kybalion_home | 17 | 17 | Kybalion Home | (none) | menu-link |
| doc_menu_link_master_documents | 17 | 17 | Master Documents | (none) | menu-link admin-only is-hidden |
| doc_menu_link_reader | 17 | 17 | Reader | (none) | menu-link |
| doc_menu_link_session_1 | 17 | 17 | Session 1 | (none) | menu-link |
| doc_menu_link_session_10 | 17 | 17 | Session 10 | (none) | menu-link |
| doc_menu_link_session_11 | 17 | 17 | Session 11 | (none) | menu-link |
| doc_menu_link_session_12 | 17 | 17 | Session 12 | (none) | menu-link |
| doc_menu_link_session_2 | 17 | 17 | Session 2 | (none) | menu-link |
| doc_menu_link_session_3 | 17 | 17 | Session 3 | (none) | menu-link |
| doc_menu_link_session_4 | 17 | 17 | Session 4 | (none) | menu-link |
| doc_menu_link_session_5 | 17 | 17 | Session 5 | (none) | menu-link |
| doc_menu_link_session_6 | 17 | 17 | Session 6 | (none) | menu-link |
| doc_menu_link_session_7 | 17 | 17 | Session 7 | (none) | menu-link |
| doc_menu_link_session_8 | 17 | 17 | Session 8 | (none) | menu-link |
| doc_menu_link_session_9 | 17 | 17 | Session 9 | (none) | menu-link |
| doc_menu_link_templates | 17 | 17 | Templates | (none) | menu-link |
| doc_menu_link_assets_6f3f30 | 5 | 5 | Assets | (none) | menu-link admin-only is-hidden |
| doc_menu_link_document_library_d48bdb | 5 | 5 | Document Library | (none) | menu-link |
| doc_menu_link_general_2e06b7 | 5 | 5 | General | (none) | menu-link |
| doc_menu_link_home_c744a8 | 5 | 5 | Home | (none) | menu-link |
| doc_menu_link_kybalion_home_5eba1b | 5 | 5 | Kybalion Home | (none) | menu-link |
| doc_menu_link_master_documents_a25f72 | 5 | 5 | Master Documents | (none) | menu-link admin-only is-hidden |
| doc_menu_link_reader_4d9073 | 5 | 5 | Reader | (none) | menu-link |
| doc_menu_link_session_1_ef7726 | 5 | 5 | Session 1 | (none) | menu-link |
| doc_menu_link_session_10_fa4588 | 5 | 5 | Session 10 | (none) | menu-link |
| doc_menu_link_session_11_c23e39 | 5 | 5 | Session 11 | (none) | menu-link |
| doc_menu_link_session_12_c94b4f | 5 | 5 | Session 12 | (none) | menu-link |
| doc_menu_link_session_2_c4222a | 5 | 5 | Session 2 | (none) | menu-link |
| doc_menu_link_session_3_4c45f6 | 5 | 5 | Session 3 | (none) | menu-link |
| doc_menu_link_session_4_10aeee | 5 | 5 | Session 4 | (none) | menu-link |
| doc_menu_link_session_5_87605e | 5 | 5 | Session 5 | (none) | menu-link |
| doc_menu_link_session_6_39915e | 5 | 5 | Session 6 | (none) | menu-link |
| doc_menu_link_session_7_9ac1e7 | 5 | 5 | Session 7 | (none) | menu-link |
| doc_menu_link_session_8_2401a1 | 5 | 5 | Session 8 | (none) | menu-link |
| doc_menu_link_session_9_8f1f6a | 5 | 5 | Session 9 | (none) | menu-link |
| doc_menu_link_templates_358284 | 5 | 5 | Templates | (none) | menu-link |

- Signature details:
  - `doc_menu_link_assets`: control_type=a; label=Assets; text=Assets; target=/kybalion/docs/assets/; classes=menu-link admin-only is-hidden; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link admin-only is-hidden; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_document_library`: control_type=a; label=Document Library; text=Document Library; target=/kybalion/docs/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_general`: control_type=a; label=General; text=General; target=/kybalion/docs/general/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_home`: control_type=a; label=Home; text=Home; target=/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_kybalion_home`: control_type=a; label=Kybalion Home; text=Kybalion Home; target=/kybalion/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_master_documents`: control_type=a; label=Master Documents; text=Master Documents; target=/kybalion/docs/master-docs/; classes=menu-link admin-only is-hidden; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link admin-only is-hidden; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_reader`: control_type=a; label=Reader; text=Reader; target=/kybalion/reader.html; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_session_1`: control_type=a; label=Session 1; text=Session 1; target=/kybalion/docs/session-01/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_10`: control_type=a; label=Session 10; text=Session 10; target=/kybalion/docs/session-10/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_11`: control_type=a; label=Session 11; text=Session 11; target=/kybalion/docs/session-11/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_12`: control_type=a; label=Session 12; text=Session 12; target=/kybalion/docs/session-12/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_2`: control_type=a; label=Session 2; text=Session 2; target=/kybalion/docs/session-02/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_3`: control_type=a; label=Session 3; text=Session 3; target=/kybalion/docs/session-03/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_4`: control_type=a; label=Session 4; text=Session 4; target=/kybalion/docs/session-04/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_5`: control_type=a; label=Session 5; text=Session 5; target=/kybalion/docs/session-05/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_6`: control_type=a; label=Session 6; text=Session 6; target=/kybalion/docs/session-06/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_7`: control_type=a; label=Session 7; text=Session 7; target=/kybalion/docs/session-07/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_8`: control_type=a; label=Session 8; text=Session 8; target=/kybalion/docs/session-08/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_9`: control_type=a; label=Session 9; text=Session 9; target=/kybalion/docs/session-09/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_templates`: control_type=a; label=Templates; text=Templates; target=/kybalion/docs/templates/; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_assets_6f3f30`: control_type=a; label=Assets; text=Assets; target=/kybalion/docs/assets/; classes=menu-link admin-only is-hidden; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link admin-only is-hidden; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_document_library_d48bdb`: control_type=a; label=Document Library; text=Document Library; target=/kybalion/docs/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_general_2e06b7`: control_type=a; label=General; text=General; target=/kybalion/docs/general/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_home_c744a8`: control_type=a; label=Home; text=Home; target=/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_kybalion_home_5eba1b`: control_type=a; label=Kybalion Home; text=Kybalion Home; target=/kybalion/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_master_documents_a25f72`: control_type=a; label=Master Documents; text=Master Documents; target=/kybalion/docs/master-docs/; classes=menu-link admin-only is-hidden; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link admin-only is-hidden; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_reader_4d9073`: control_type=a; label=Reader; text=Reader; target=/kybalion/reader.html; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `doc_menu_link_session_1_ef7726`: control_type=a; label=Session 1; text=Session 1; target=/kybalion/docs/session-01/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_10_fa4588`: control_type=a; label=Session 10; text=Session 10; target=/kybalion/docs/session-10/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_11_c23e39`: control_type=a; label=Session 11; text=Session 11; target=/kybalion/docs/session-11/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_12_c94b4f`: control_type=a; label=Session 12; text=Session 12; target=/kybalion/docs/session-12/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_2_c4222a`: control_type=a; label=Session 2; text=Session 2; target=/kybalion/docs/session-02/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_3_4c45f6`: control_type=a; label=Session 3; text=Session 3; target=/kybalion/docs/session-03/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_4_10aeee`: control_type=a; label=Session 4; text=Session 4; target=/kybalion/docs/session-04/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_5_87605e`: control_type=a; label=Session 5; text=Session 5; target=/kybalion/docs/session-05/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_6_39915e`: control_type=a; label=Session 6; text=Session 6; target=/kybalion/docs/session-06/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_7_9ac1e7`: control_type=a; label=Session 7; text=Session 7; target=/kybalion/docs/session-07/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_8_2401a1`: control_type=a; label=Session 8; text=Session 8; target=/kybalion/docs/session-08/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_session_9_8f1f6a`: control_type=a; label=Session 9; text=Session 9; target=/kybalion/docs/session-09/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper div menu-sessions-flyout is-hidden menusessionsflyout a menu-link; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `doc_menu_link_templates_358284`: control_type=a; label=Templates; text=Templates; target=/kybalion/docs/templates/; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu

#### sessions_trigger_1

| Auto Name | Count | Pages | Sample Label | Sample ID | Sample Classes |
|---|---:|---:|---|---|---|
| sessions_trigger_button_menusessionsbtn | 17 | 17 | Sessions ▸ | menuSessionsBtn | menu-link menu-sessions-trigger |
| sessions_trigger_button_menusessionsbtn_5c3df7 | 5 | 5 | Sessions ▸ | menuSessionsBtn | menu-link menu-sessions-trigger |

- Signature details:
  - `sessions_trigger_button_menusessionsbtn`: control_type=button; label=Sessions ▸; text=Sessions ▸; target=menuSessionsBtn; id=menuSessionsBtn; classes=menu-link menu-sessions-trigger; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper button menu-link menu-sessions-trigger menusessionsbtn; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu
  - `sessions_trigger_button_menusessionsbtn_5c3df7`: control_type=button; label=Sessions ▸; text=Sessions ▸; target=menuSessionsBtn; id=menuSessionsBtn; classes=menu-link menu-sessions-trigger; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section div menu-sessions-wrapper button menu-link menu-sessions-trigger menusessionsbtn; is_menu_item=yes; is_dropdown_trigger=yes; placement=header_menu

#### auth_menu_link_1

| Auto Name | Count | Pages | Sample Label | Sample ID | Sample Classes |
|---|---:|---:|---|---|---|
| auth_menu_change_password_link | 17 | 17 | Change Password | menuChangePasswordLink | menu-link is-hidden |
| auth_menu_sign_out_button | 17 | 17 | Log Out | menuSignOutLink | menu-link is-hidden |
| auth_menu_change_password_link_31960a | 5 | 5 | Change Password | menuChangePasswordLink | menu-link is-hidden |
| auth_menu_sign_out_button_d61cea | 5 | 5 | Log Out | menuSignOutLink | menu-link is-hidden |
| auth_menu_sign_in_redirect_kybalion | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_assets | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_general | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_master_docs | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_session_01 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_session_02 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_session_03 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_session_04 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_session_05 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_session_06 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_session_07 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_session_08 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_session_09 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_session_10 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_session_11 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_session_12 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_docs_templates | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_invite1 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_invite2 | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_quick | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |
| auth_menu_sign_in_redirect_kybalion_reader_html | 1 | 1 | Sign In / Create Account | menuAuthLink | menu-link |

- Signature details:
  - `auth_menu_change_password_link`: control_type=a; label=Change Password; text=Change Password; target=/app/user-settings; id=menuChangePasswordLink; classes=menu-link is-hidden; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link is-hidden menuchangepasswordlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_out_button`: control_type=button; label=Log Out; text=Log Out; target=menuSignOutLink; id=menuSignOutLink; classes=menu-link is-hidden; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section button menu-link is-hidden menusignoutlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_change_password_link_31960a`: control_type=a; label=Change Password; text=Change Password; target=/app/user-settings; id=menuChangePasswordLink; classes=menu-link is-hidden; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link is-hidden menuchangepasswordlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_out_button_d61cea`: control_type=button; label=Log Out; text=Log Out; target=menuSignOutLink; id=menuSignOutLink; classes=menu-link is-hidden; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section button menu-link is-hidden menusignoutlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/; id=menuAuthLink; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/; id=menuAuthLink; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_assets`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/assets/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_general`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/general/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_master_docs`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/master-docs/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_session_01`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/session-01/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_session_02`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/session-02/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_session_03`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/session-03/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_session_04`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/session-04/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_session_05`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/session-05/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_session_06`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/session-06/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_session_07`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/session-07/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_session_08`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/session-08/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_session_09`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/session-09/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_session_10`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/session-10/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_session_11`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/session-11/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_session_12`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/session-12/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_docs_templates`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/docs/templates/; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_invite1`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/invite1/; id=menuAuthLink; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_invite2`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/invite2/; id=menuAuthLink; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_quick`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/quick/; id=menuAuthLink; classes=menu-link; context_signature=html body div page-wrap header topbar div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu
  - `auth_menu_sign_in_redirect_kybalion_reader_html`: control_type=a; label=Sign In / Create Account; text=Sign In / Create Account; target=/auth/login?redirect=/kybalion/reader.html; id=menuAuthLink; classes=menu-link; context_signature=html body header page-header div header-content div header-actions div menu-wrapper div menu-panel is-hidden menupanel div menu-section a menu-link menuauthlink; is_menu_item=yes; is_dropdown_trigger=no; placement=header_menu

#### docs_admin_action_button_1

| Auto Name | Count | Pages | Sample Label | Sample ID | Sample Classes |
|---|---:|---:|---|---|---|
| docs_admin_new_folder_button | 16 | 16 | + New | headerNewFolderBtn | button secondary is-hidden |
| docs_admin_upload_button | 16 | 16 | Upload | headerUploadBtn | button primary is-hidden |
| docs_admin_upload_input | 16 | 16 | input:file | uploadInput | file-input-hidden |
| docs_admin_new_folder_button_ef3d1a | 1 | 1 | + New | headerNewFolderBtn | button secondary is-hidden |
| docs_admin_upload_button_feaaf7 | 1 | 1 | Upload | headerUploadBtn | button primary is-hidden |
| docs_admin_upload_input_07c76e | 1 | 1 | input:file | uploadInput | file-input-hidden |

- Signature details:
  - `docs_admin_new_folder_button`: control_type=button; label=+ New; text=+ New; target=headerNewFolderBtn; id=headerNewFolderBtn; classes=button secondary is-hidden; context_signature=html body header page-header div header-content div header-actions button button secondary is-hidden headernewfolderbtn; is_menu_item=no; is_dropdown_trigger=no; placement=header
  - `docs_admin_upload_button`: control_type=button; label=Upload; text=Upload; target=headerUploadBtn; id=headerUploadBtn; classes=button primary is-hidden; context_signature=html body header page-header div header-content div header-actions button button primary is-hidden headeruploadbtn; is_menu_item=no; is_dropdown_trigger=no; placement=header
  - `docs_admin_upload_input`: control_type=input; label=input:file; target=uploadInput; id=uploadInput; classes=file-input-hidden; context_signature=html body header page-header div header-content div header-actions input file-input-hidden uploadinput; is_menu_item=no; is_dropdown_trigger=no; placement=header
  - `docs_admin_new_folder_button_ef3d1a`: control_type=button; label=+ New; text=+ New; target=headerNewFolderBtn; id=headerNewFolderBtn; classes=button secondary is-hidden; context_signature=html body div page-wrap div docs-header-meta div header-actions button button secondary is-hidden headernewfolderbtn; is_menu_item=no; is_dropdown_trigger=no; placement=other
  - `docs_admin_upload_button_feaaf7`: control_type=button; label=Upload; text=Upload; target=headerUploadBtn; id=headerUploadBtn; classes=button primary is-hidden; context_signature=html body div page-wrap div docs-header-meta div header-actions button button primary is-hidden headeruploadbtn; is_menu_item=no; is_dropdown_trigger=no; placement=other
  - `docs_admin_upload_input_07c76e`: control_type=input; label=input:file; target=uploadInput; id=uploadInput; classes=file-input-hidden; context_signature=html body div page-wrap div docs-header-meta div header-actions input file-input-hidden uploadinput; is_menu_item=no; is_dropdown_trigger=no; placement=other

## Authoritative Main Menu Visual Contract

- Source of truth: `index.html` (`/kybalion/`) menu selectors and token values.
- Enforced target: `docs/styles.css` (`/kybalion/docs/`) must match authoritative menu tokens for key selectors.
- PASS: Docs Main Menu visual tokens match the authoritative `/kybalion/` contract.

## Control Frequency

| Control Label | Frequency |
|---|---:|
| main menu | 22 |
| home | 22 |
| kybalion home | 22 |
| reader | 22 |
| document library | 22 |
| sign in / create account | 22 |
| change password | 22 |
| log out | 22 |
| general | 22 |
| sessions ▸ | 22 |
| session 1 | 22 |
| session 2 | 22 |
| session 3 | 22 |
| session 4 | 22 |
| session 5 | 22 |
| session 6 | 22 |
| session 7 | 22 |
| session 8 | 22 |
| session 9 | 22 |
| session 10 | 22 |
| session 11 | 22 |
| session 12 | 22 |
| templates | 22 |
| assets | 22 |
| master documents | 22 |
| upload | 17 |
| + new | 17 |
| input:file | 17 |
| close | 3 |
| search | 2 |

## Placement Patterns

| Placement | Count |
|---|---:|
| header_menu | 550 |
| header | 60 |
| other | 8 |

## Style Token Patterns

| Class Tokens | Count |
|---|---:|
| menu-link | 418 |
| menu-link is-hidden | 44 |
| menu-link admin-only is-hidden | 44 |
| button secondary | 32 |
| menu-link menu-sessions-trigger | 22 |
| button secondary is-hidden | 18 |
| button primary is-hidden | 17 |
| file-input-hidden | 17 |
| button secondary search-button | 1 |
| is-active view-pill-button | 1 |
| view-pill-button | 1 |

## Per-Page Header Controls

### docs/assets/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/general/index.html
- Total controls: 29
- Unique labels: 29
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Search, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/master-docs/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/session-01/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/session-02/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/session-03/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/session-04/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/session-05/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/session-06/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/session-07/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/session-08/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/session-09/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/session-10/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/session-11/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/session-12/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### docs/templates/index.html
- Total controls: 28
- Unique labels: 28
- Controls: + New, Assets, Change Password, Document Library, General, Home, input:file, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates, Upload

### index.html
- Total controls: 25
- Unique labels: 25
- Controls: Assets, Change Password, Document Library, General, Home, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates

### invite1/index.html
- Total controls: 25
- Unique labels: 25
- Controls: Assets, Change Password, Document Library, General, Home, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates

### invite2/index.html
- Total controls: 25
- Unique labels: 25
- Controls: Assets, Change Password, Document Library, General, Home, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates

### quick/index.html
- Total controls: 25
- Unique labels: 25
- Controls: Assets, Change Password, Document Library, General, Home, Kybalion Home, Log Out, Main Menu, Master Documents, Reader, Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Templates

### reader.html
- Total controls: 41
- Unique labels: 39
- Controls: Add Tag, Annotate, Assets, Change Password, Close, Copy All Notes, Document Library, Edit layout, General, Home, Kybalion Home, Log Out, Main Menu, Master Documents, Profile, Reader, Reset layout, Save highlight as Note, Search, Search the text..., Session 1, Session 10, Session 11, Session 12, Session 2, Session 3, Session 4, Session 5, Session 6, Session 7, Session 8, Session 9, Sessions ▸, Sign In / Create Account, Standard, Stanza, tagFilter, Templates, View Notes

## Consistency Findings

- Docs/reader pages follow the Main Menu panel pattern with `menu-link` controls.
- The hub page now uses the shared Main Menu panel contract.
- `Main Menu` is present on all audited pages, so the global entry point is consistent for visitor/member/admin states. This shared menu-button design is standardized as `main_menu_button_1`.
- All audited pages now include header/menu navigation controls.
- `menu-link` is now the dominant shared control token across pages.
- `Assets` and `Master Documents` are consistently tagged as `admin-only` across all audited pages.
- Top-level pages (`index`, `invite1`, `invite2`, `quick`) consistently implement auth-runtime contract wiring (required auth control IDs/default visibility, Supabase data attributes, and shared `auth-sync.js` + `menu-shell.js` includes).
- Menu ordering contract is consistent on all audited pages: Navigation (`Home → Kybalion Home → Reader → Document Library`) and Documents (`General → Sessions ▸ → Session 1..12 → Templates → Assets → Master Documents`).
- Exact menu section labels and ARIA contract are consistent on all audited pages: section titles start with `Navigation`, `Documents`; `#menuBtn` uses `aria-haspopup="true"`, `aria-expanded="false"`, and `aria-controls="menuPanel"`; `#menuPanel` exposes `role="menu"` with `aria-label="Documents"`.
- Sessions flyout ARIA linkage is enforced across all audited pages: `#menuSessionsBtn` and `#menuSessionsFlyout` are present and wired with `aria-controls="menuSessionsFlyout"` plus synchronized `aria-expanded` state (via explicit markup or page runtime initialization).
- Sessions flyout keyboard contract is enforced across all audited pages: pressing `Escape` closes the sessions flyout first and returns focus to `#menuSessionsBtn` (via active page runtime/fallback wiring).
- Sessions flyout focus contract is enforced across all audited pages: opening the flyout focuses the first flyout item, and `Tab` / `Shift+Tab` are contained within the flyout interaction loop (via active page runtime/fallback wiring).
- Sessions flyout roving-focus contract is enforced across all audited pages: `ArrowDown`/`ArrowUp` move through session links with wrap behavior, and `Home`/`End` jump to first/last flyout item (via active page runtime/fallback wiring).
- Sessions flyout keyboard listener attachment is consistent across all audited pages: both Tab containment and roving-focus handlers are attached to `#menuSessionsBtn` and `#menuSessionsFlyout` in active runtime/fallback paths.

## Cleanup Kickoff

1. Define a single header contract for all Kybalion top-level pages (`home`, `reader`, `docs`, `auth`).
2. Align menu trigger/button classes to the same token set across docs, reader, hub, and invite/quick pages.
3. Standardize button class tokens for global controls (`primary`, `secondary`, `menu-link`).
4. Normalize auth-state controls (`Sign In / Create Account`, `Change Password`, `Log Out`) where role-aware behavior is needed.
