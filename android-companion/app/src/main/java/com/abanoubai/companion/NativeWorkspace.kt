package com.abanoubai.companion

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.PermanentDrawerSheet
import androidx.compose.material3.PermanentNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

private val ExecutiveGold = Color(0xFFD6A84C)
private val ExecutiveGoldLight = Color(0xFFF7DEA0)
private val ExecutiveDark = Color(0xFF0D0D10)
private val ExecutivePanel = Color(0xFF17171C)
private val ExecutiveBorder = Color(0xFF2C2A25)
private val ExecutiveIvory = Color(0xFFF5F2EC)
private val ExecutiveInk = Color(0xFF28251F)

private data class WorkspaceDestination(val title: String, val group: String, val mark: String)

private val destinations = listOf(
    WorkspaceDestination("الرئيسية", "مساحة العمل", "⌂"),
    WorkspaceDestination("المساعد الذكي", "الذكاء والتنفيذ", "✦"),
    WorkspaceDestination("شبكة النماذج", "الذكاء والتنفيذ", "◈"),
    WorkspaceDestination("الوكلاء", "الذكاء والتنفيذ", "◎"),
    WorkspaceDestination("التخطيط والمهام", "الذكاء والتنفيذ", "▦"),
    WorkspaceDestination("سجل النشاط", "الذكاء والتنفيذ", "◷"),
    WorkspaceDestination("الذاكرة", "المعرفة والمساحات", "◉"),
    WorkspaceDestination("المشروعات", "المعرفة والمساحات", "▤"),
    WorkspaceDestination("المكتبة", "المعرفة والمساحات", "▥"),
    WorkspaceDestination("الصور والمخرجات", "المعرفة والمساحات", "◇"),
    WorkspaceDestination("أجهزة متصلة", "الأجهزة والتكاملات", "▣"),
    WorkspaceDestination("التكاملات", "الأجهزة والتكاملات", "⌘"),
    WorkspaceDestination("الإعدادات", "النظام", "⚙")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NativeWorkspaceScreen() {
    var darkMode by remember { mutableStateOf(true) }
    val colors = if (darkMode) {
        darkColorScheme(primary = ExecutiveGold, onPrimary = ExecutiveDark, background = ExecutiveDark,
            surface = ExecutivePanel, onSurface = Color(0xFFF5F1E8), secondary = ExecutiveGoldLight, outline = ExecutiveBorder)
    } else {
        lightColorScheme(primary = Color(0xFF8F6427), onPrimary = Color.White, background = ExecutiveIvory,
            surface = Color.White, onSurface = ExecutiveInk, secondary = ExecutiveGold, outline = Color(0xFFE4DED2))
    }
    MaterialTheme(colorScheme = colors) {
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
            Surface(Modifier.fillMaxSize(), color = colors.background) {
                NativeWorkspaceContent(darkMode, { darkMode = !darkMode })
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NativeWorkspaceContent(darkMode: Boolean, onToggleTheme: () -> Unit) {
    var selected by remember { mutableStateOf("الرئيسية") }
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val groups = destinations.groupBy { it.group }

    BoxWithConstraints(Modifier.fillMaxSize()) {
        // Keep the user's requested drawer navigation on phones; use a persistent
        // drawer on expanded windows instead of switching to bottom navigation.
        val expanded = maxWidth >= 840.dp

        val drawerBody: @Composable (Boolean) -> Unit = { permanent ->
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(18.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(46.dp).background(ExecutiveDark, RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center) {
                        Text("A", color = ExecutiveGoldLight, fontSize = 27.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("AbanoubAI", fontWeight = FontWeight.Bold, fontSize = 19.sp)
                        Text("مساحة الذكاء والتنفيذ", color = MaterialTheme.colorScheme.onSurface.copy(alpha = .62f), fontSize = 11.sp)
                    }
                }
                Spacer(Modifier.height(20.dp))
                groups.forEach { (group, items) ->
                    Text(group, color = ExecutiveGold, fontSize = 11.sp, fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(top = 14.dp, bottom = 8.dp))
                    items.forEach { item ->
                        NavigationDrawerItem(
                            label = { Text(item.title, fontWeight = if (selected == item.title) FontWeight.SemiBold else FontWeight.Normal) },
                            selected = selected == item.title,
                            onClick = {
                                selected = item.title
                                if (!permanent) scope.launch { drawerState.close() }
                            },
                            icon = { Text(item.mark, fontSize = 18.sp, color = if (selected == item.title) ExecutiveGold else MaterialTheme.colorScheme.onSurface) },
                            modifier = Modifier.padding(vertical = 2.dp),
                            shape = RoundedCornerShape(13.dp)
                        )
                    }
                }
                Spacer(Modifier.height(18.dp))
                Divider(color = MaterialTheme.colorScheme.outline)
                Text("واجهة أصلية قيد التطوير — الوظائف لا تُعرض كمكتملة قبل ربطها واختبارها",
                    fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = .55f),
                    modifier = Modifier.padding(top = 14.dp))
            }
        }

        val workspaceBody: @Composable (Boolean) -> Unit = { showMenuButton ->
            Scaffold(containerColor = MaterialTheme.colorScheme.background) { padding ->
                Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState())) {
                    Row(
                        Modifier.fillMaxWidth().padding(horizontal = 18.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (showMenuButton) {
                                IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                    Text("☰", color = MaterialTheme.colorScheme.onSurface, fontSize = 23.sp)
                                }
                            }
                            Spacer(Modifier.width(if (showMenuButton) 8.dp else 4.dp))
                            Column {
                                Text("AbanoubAI", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                                Text("PERSONAL INTELLIGENCE OS", color = ExecutiveGold, fontSize = 9.sp, letterSpacing = 1.sp)
                            }
                        }
                        IconButton(onClick = onToggleTheme) {
                            Text(if (darkMode) "☼" else "◐", color = ExecutiveGold, fontSize = 22.sp)
                        }
                    }
                    if (selected == "الرئيسية") {
                        HomeWorkspaceContent { selected = it }
                    } else {
                        DestinationPlaceholder(selected)
                    }
                }
            }
        }

        if (expanded) {
            PermanentNavigationDrawer(
                drawerContent = {
                    PermanentDrawerSheet(
                        modifier = Modifier.width(304.dp),
                        drawerContainerColor = MaterialTheme.colorScheme.surface,
                        drawerContentColor = MaterialTheme.colorScheme.onSurface
                    ) {
                        drawerBody(true)
                    }
                }
            ) {
                workspaceBody(false)
            }
        } else {
            ModalNavigationDrawer(
                drawerState = drawerState,
                drawerContent = {
                    ModalDrawerSheet(
                        modifier = Modifier.width(304.dp),
                        drawerContainerColor = MaterialTheme.colorScheme.surface,
                        drawerContentColor = MaterialTheme.colorScheme.onSurface
                    ) {
                        drawerBody(false)
                    }
                }
            ) {
                workspaceBody(true)
            }
        }
    }
}

@Composable
private fun HomeWorkspaceContent(onOpenDestination: (String) -> Unit) {
    Column(Modifier.fillMaxWidth().padding(horizontal = 18.dp, vertical = 10.dp)) {
        Text("مساحة العمل", fontSize = 29.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        Text("كل ما تحتاجه للتفكير والتخطيط والتنفيذ في مكان واحد.",
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = .64f), fontSize = 13.sp,
            modifier = Modifier.padding(top = 6.dp))
        Spacer(Modifier.height(22.dp))
        Card(
            Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
        ) {
            Column(Modifier.padding(20.dp)) {
                Text("A  /  ABANOUBAI", color = ExecutiveGold, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.4.sp)
                Spacer(Modifier.height(12.dp))
                Text("حوّل أفكارك إلى إنجازات.", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                Text("ابدأ بهدف واضح، ورتّب خطواتك، وتابع ما تم تنفيذه وما يحتاج مراجعة.",
                    fontSize = 13.sp, lineHeight = 21.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = .68f),
                    modifier = Modifier.padding(top = 8.dp))
                Spacer(Modifier.height(18.dp))
                Button(onClick = { onOpenDestination("المساعد الذكي") },
                    colors = ButtonDefaults.buttonColors(containerColor = ExecutiveGold),
                    shape = RoundedCornerShape(14.dp),
                    contentPadding = PaddingValues(horizontal = 18.dp, vertical = 13.dp)) {
                    Text("ابدأ مع المساعد", color = ExecutiveDark, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Text("←", color = ExecutiveDark)
                }
            }
        }
        Spacer(Modifier.height(18.dp))
        Text("مساحاتك", fontSize = 17.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        Spacer(Modifier.height(10.dp))
        val quick = listOf(
            "الوكلاء" to "إدارة المهام المتخصصة",
            "التخطيط والمهام" to "خططك ومواعيدك",
            "الذاكرة" to "سياقك ومعلوماتك المحفوظة",
            "المشروعات" to "أعمالك ومساحاتك"
        )
        quick.forEach { (title, detail) ->
            Card(
                Modifier.fillMaxWidth().padding(bottom = 9.dp).clickable { onOpenDestination(title) },
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(title, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurface)
                        Text(detail, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = .6f))
                    }
                    Text("←", color = ExecutiveGold, fontSize = 20.sp)
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        Card(
            Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(Modifier.padding(16.dp)) {
                Text("النشاط الأخير", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                Text("لا توجد بيانات نشاط موصولة بهذه الواجهة حتى الآن.",
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = .62f), fontSize = 12.sp,
                    modifier = Modifier.padding(top = 7.dp))
            }
        }
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun DestinationPlaceholder(title: String) {
    Column(Modifier.fillMaxWidth().padding(22.dp)) {
        Text(title, fontSize = 27.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        Spacer(Modifier.height(16.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
            shape = RoundedCornerShape(20.dp)
        ) {
            Column(Modifier.padding(20.dp)) {
                Text("هذه الوجهة أصبحت ضمن التنقل الأصلي.", color = ExecutiveGold, fontWeight = FontWeight.SemiBold)
                Text("وظائف هذا القسم وربطه ببيانات الحساب قيد النقل والاختبار. لن نعرض بيانات تجريبية على أنها بيانات حقيقية.",
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = .7f), fontSize = 13.sp,
                    modifier = Modifier.padding(top = 10.dp))
            }
        }
    }
}
