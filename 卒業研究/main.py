# coding: utf-8


#お約束
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import plotly.graph_objects as go
import plotly.offline as po
import plotly.tools
import subprocess
from subprocess import Popen, PIPE, run
import sys
import os
import math


def min_max(x, axis = None):
    min = x.min(axis = axis, keepdims = True)
    max = x.max(axis = axis, keepdims = True)
    result = (x - min)/(max-min)
    return result

#実行時引数読み込み
args = sys.argv #第一引数ファイル名　第二引数V0



#CHGCAR読みこみ

#SystemName
cmd0 = "head -n 1 " + str(args[1])
res0 = subprocess.run(cmd0, shell = True, stdout = PIPE,stderr= PIPE, universal_newlines=True)
SystemName = res0.stdout.strip()


#原子数
cmd1 = "head -n 7 " +str(args[1]) + " | tail -n 1"
res1 = subprocess.run(cmd1, shell = True, stdout = PIPE,stderr= PIPE, universal_newlines=True)
stdout_data1 = res1.stdout.split()
atom_count = np.int64(stdout_data1)
atom_sum = np.sum(atom_count)


#メッシュの数
cmd2 = "head -n " + str(10 + atom_sum) +" "+ str(args[1]) + " | tail -n 1"
res2 = subprocess.run(cmd2, shell = True, stdout = PIPE,stderr= PIPE,universal_newlines=True)
stdout_data2 = res2.stdout.split()
mesh = np.int64(np.array(stdout_data2))
mesh
Mesh_x = mesh[0]
Mesh_y = mesh[1]
Mesh_z = mesh[2]
mesh_total = Mesh_x * Mesh_y * Mesh_z

#電荷密度
cmd3 = "head -n " + str(10 + atom_sum + math.ceil(mesh_total/5)) +" "+ str(args[1]) + " | tail -n " + str(math.ceil(mesh_total/5))
res3 = subprocess.run(cmd3, shell = True, stdout = PIPE,stderr= PIPE,universal_newlines=True)
stdout_data3 = res3.stdout.split()
CHG_D = np.array(np.float64(stdout_data3))

#軸
cmd4 = "head -n 5 "+ str(args[1]) + " | tail -n 3"
res4 = subprocess.run(cmd4, shell = True, stdout = PIPE,stderr= PIPE,universal_newlines=True)
stdout_data4 = res4.stdout.split()
SystemAxis = np.float64(np.array(stdout_data4)).reshape(3,3)
vol = np.linalg.det(SystemAxis)

#原子位置
cmd5 = "head -n " + str(8 + atom_sum)+" "+ str(args[1]) + " | tail -n "+str(atom_sum)
res5 = subprocess.run(cmd5, shell = True, stdout = PIPE,stderr= PIPE,universal_newlines=True)
AtomCdn_i = np.array(np.float64(res5.stdout.split())).reshape(-1,3)

#電荷密度の３次元配列化
V = np.array(CHG_D).reshape([Mesh_x, Mesh_y, Mesh_z],order = 'F')

##############################################
#式を作るぞ
##############################################
#真空層の中心z_offsetを判断する。
##CHGCARから原子位置のz座標Z_iを抽出する。 Z_iは長さNの配列（0<=i<N）で、各項は0<=Z_i<1となる。
#Z軸の値だけ
Z_i = AtomCdn_i[:, 2]
Z_i
##z_iの間隔が最も空く場所を探し、その両端をZ_small、Z_largeとする。
##Z_small < z < Z_largeの間に原子(Z_i)がないなら、z_offsetは (z_small+z_large)/2。そうでなければ、z_offsetは(z_small+z_large+1)/2。
Z_i_stack = np.sort(np.hstack((Z_i, Z_i + 1)))
Z_Sa = np.roll(Z_i_stack, -1) - Z_i_stack
Z_center = Z_i[np.argmax(Z_Sa)] + 0.5*Z_Sa[np.argmax(Z_Sa)]
z_offset = int(Z_center * Mesh_z)
z_offset
#(2) 原子位置をz方向に規格化する。
#CHGCARメッシュ上で、真空層の中心がz=0に来るようにする。
#メッシュのオフセット　z_offset=int(z_offset*M)を求める。
#原子位置のオフセット Z_offset=z_offset/Mも出す (注：intで丸めているのでこちらのオフセットも出す必要もあり)
Z_offset = z_offset/Mesh_z
#(3) CHGCARから斥力項と引力項を作って足してポテンシャルを作る。
#CHGCARの値(ρ)から、メッシュ状の各点についてV=ρ+1/ρを計算する。


U = np.roll(V,-z_offset,axis = 2)
V0 = vol * np.float64(args[2])
U = U + ((V0*V0)/U)
p = np.min(U)
Ucolor = min_max(U)

#(4) ポテンシャルをz方向に規格化する。
#Vにオフセットを加える。V'(i,j,k)=V'(i,j,k-z_offset+M*n)、nは0<=k-z_offset+M*n<Mになるように調整する値。
#k=0でV'はflatになっているはず(k=1と同じ値になるかもしれない)
#(5) ポテンシャルをz方向に規格化する。
#z軸方向でk=1から、kが増える方向に探っていく。

'''
#(x=10,y=10)のz軸上のU変化
Test0 = U[10,10,:]
# プロット
plt.figure()
plt.plot(range(0,Mesh_z),Test0, label="test")
plt.title('U = (x=10,y=10,z)')
plt.yscale('log')
plt.savefig('U-z.png')
# プロット表示(設定の反映)
plt.show()

#(x=10,y=10)のz軸上のnon rollU変化
V0 = vol * np.float64(args[2])
V = V + ((V0*V0)/V)
Test1 = V[10,10,:]
plt.figure()
plt.plot(range(0,Mesh_z),Test1, label="test")
plt.title('U = (x=10,y=10,z)')
plt.yscale('log')
plt.savefig('U-z nonroll.png')
# プロット表示(設定の反映)
plt.show()
'''

Z_co = np.empty((Mesh_x,Mesh_y))
Z_min = np.empty((Mesh_x,Mesh_y))

for i in range(Mesh_x):
   for j in range(Mesh_y):
       for k in range(Mesh_z-5,5,-1):
           a = U[i ,j ,k+1]
           b = U[i ,j ,k]
           c = U[i ,j ,k-1]
           if b < c and b < a:
               #print(i,j,k)
               t = [(k+1+z_offset)/Mesh_z, (k+z_offset)/Mesh_z, (k-1+z_offset)/Mesh_z]
               s = [a, b, c]
               Keisu = np.polyfit(t,s,2) #係数の配列
               Z_co[i,j] = (-(Keisu[1]/(2*Keisu[0])))%1

               Z_min[i,j] = k
               #(k,a), (k+1,b), (k+2,c) の最小自乗法を行う（放物線近似）
               #最小となるkを、Z_min(i,j)とする
               #次の(i,j)について検討する
               break

'''
Z_co
plt.figure()
plt.imshow(Z_co)
plt.savefig('Z_co.png')
plt.show()
'''

#このようにすると、二次元配列Z_min(i,j)が得られる。Z_minの値は2<Z_min(i,j)<(M/2)である小数（整数にならない）。

#(6) Z_min をxy方向で探り、極値を探す。
#　Z_min(i,j)の周囲8マスと自分自身の値を出す。対になる位置と自分自身の値、計３点を４セット考える：
#（i-1,j),(i,j),(i+1,j)など。当然、二次元境界条件でループする。
#４セット全てにつき自分自身が最大なら極大値、自分自身が最小なら極小値、一部で自分自身が最大、残りで自分が最小自身なら鞍点。
Z_co_Ex = np.empty((Mesh_x + 2, Mesh_y + 2))
Z_co_Ex = np.pad(Z_co,(1,1),'wrap')

ExVaCheck = np.zeros((Mesh_x,Mesh_y))

#横
for i in range(Mesh_x):
   for j in range(Mesh_y):
    if Z_co_Ex[i,j+1] >= Z_co_Ex[i+1,j+1] and Z_co_Ex[i+2,j+1] >= Z_co_Ex[i+1,j+1] :
        ExVaCheck[i,j] += 1
    elif Z_co_Ex[i,j+1] <= Z_co_Ex[i+1,j+1] and Z_co_Ex[i+2,j+1] <= Z_co_Ex[i+1,j+1] :
        ExVaCheck[i,j] += 10
    else :
        ExVaCheck[i,j] += 100

#縦
for i in range(Mesh_x):
   for j in range(Mesh_y):
    if Z_co_Ex[i+1,j] >= Z_co_Ex[i+1,j+1] and Z_co_Ex[i+1,j+2] >= Z_co_Ex[i+1,j+1] :
        ExVaCheck[i,j] += 1
    elif Z_co_Ex[i+1,j] <= Z_co_Ex[i+1,j+1] and Z_co_Ex[i+1,j+2] <= Z_co_Ex[i+1,j+1] :
        ExVaCheck[i,j] += 10
    else :
        ExVaCheck[i,j] += 100

#斜め\
for i in range(Mesh_x):
   for j in range(Mesh_y):
    if Z_co_Ex[i+2,j+2] >= Z_co_Ex[i+1,j+1] and Z_co_Ex[i,j] >= Z_co_Ex[i+1,j+1] :
        ExVaCheck[i,j] += 1
    elif Z_co_Ex[i+2,j+2] <= Z_co_Ex[i+1,j+1] and Z_co_Ex[i,j] <= Z_co_Ex[i+1,j+1] :
        ExVaCheck[i,j] += 10
    else :
        ExVaCheck[i,j] += 100

#斜め/
for i in range(Mesh_x):
   for j in range(Mesh_y):
    if Z_co_Ex[i,j+2] >= Z_co_Ex[i+1,j+1] and Z_co_Ex[i+2,j] >= Z_co_Ex[i+1,j+1] :
        ExVaCheck[i,j] += 1
    elif Z_co_Ex[i,j+2] < Z_co_Ex[i+1,j+1] and Z_co_Ex[i+2,j] <= Z_co_Ex[i+1,j+1] :
        ExVaCheck[i,j] += 10
    else :
        ExVaCheck[i,j] += 100
'''
plt.imshow(ExVaCheck)
plt.savefig('ExVaCheck.png')
plt.show()
'''
#(7) 極値の座標を報告する。
#極値となるZ_min(i,j)につき、座標(i/(X方向メッシュ数),j/(Y方向メッシュ数),(Z_min+Z_offset)/(Z方向メッシュ数)-n)を報告する。
#最後の座標が0と1の間になるようにnを決める。
Min_Zahyou = []
Max_Zahyou = []
Saddle_Zahyou = []
count = 0



for i in range(Mesh_x) :
    for j in range(Mesh_y) :
        if ExVaCheck[i,j] == 4 :
            Min_Zahyou.append([i/Mesh_x, j/Mesh_y,Z_co[i,j]])
        elif ExVaCheck[i,j] == 40 :
            Max_Zahyou.append([i/Mesh_x,j/Mesh_y,Z_co[i,j]])
        elif ExVaCheck[i,j] >4 and ExVaCheck[i,j] < 140 :
            Saddle_Zahyou.append([i/Mesh_x,j/Mesh_y,Z_co[i,j]])
        else :
            count += 1

#Z_offset
#z_offset

print("極小")
print(*Min_Zahyou, sep='\n')
print("極大")
print(*Max_Zahyou, sep='\n')
print("鞍点")
print(*Saddle_Zahyou, sep='\n')
count
